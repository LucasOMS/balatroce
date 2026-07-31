import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";
import { BehaviorSubject, filter, firstValueFrom } from "rxjs";
import { BotHttpService } from "./bot-http.service";
import { BotMethod } from "../interfaces/bot-request";
import { TwitchActionDeciderService } from "./twitch-action-decider.service";
import { AutosaveService } from "./autosave.service";

const execAsync = promisify(exec);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Surveille périodiquement la disponibilité de l'API BalatroBot.
 *
 * Le mod Balatro peut planter et couper son serveur HTTP sans que le jeu
 * lui-même ne se ferme forcément. Ce service sonde régulièrement l'API
 * (méthode `health`) et, après plusieurs échecs consécutifs, considère que
 * le jeu ne répond plus : il déclenche alors une relance (`npm run
 * restart-game`, voir package.json) et met en pause le timer de vote Twitch
 * Plays le temps que le jeu et le mod redémarrent.
 *
 * Variables d'environnement :
 * - WATCHDOG_CHECK_INTERVAL_MS : intervalle (ms) entre deux health checks (défaut 5000)
 * - WATCHDOG_FAILURE_THRESHOLD : nombre d'échecs consécutifs avant de déclencher une relance (défaut 3)
 * - WATCHDOG_PRE_KILL_DELAY_MS : délai (ms) entre l'affichage du message de redémarrage sur
 *   l'overlay et l'arrêt effectif du jeu, pour laisser le temps au client de le rendre (défaut 2000)
 * - WATCHDOG_KILL_TO_LAUNCH_DELAY_MS : délai (ms) entre l'arrêt et la relance du jeu (défaut 3000)
 * - WATCHDOG_RETRY_MS : délai (ms) avant de recommencer à sonder après une relance (défaut 5000)
 */
@Injectable()
export class GameWatchdogService implements OnModuleInit, OnModuleDestroy {
  /** Message affiché sur l'overlay pendant la relance du jeu */
  public static readonly RESTART_MESSAGE =
    "Petit problème technique, redémarrage du jeu en cours";

  private static readonly CHECK_INTERVAL_MS = parseInt(
    process.env.WATCHDOG_CHECK_INTERVAL_MS ?? "5000",
    10,
  );
  private static readonly FAILURE_THRESHOLD = parseInt(
    process.env.WATCHDOG_FAILURE_THRESHOLD ?? "3",
    10,
  );
  private static readonly PRE_KILL_DELAY_MS = parseInt(
    process.env.WATCHDOG_PRE_KILL_DELAY_MS ?? "2000",
    10,
  );
  private static readonly KILL_TO_LAUNCH_DELAY_MS = parseInt(
    process.env.WATCHDOG_KILL_TO_LAUNCH_DELAY_MS ?? "3000",
    10,
  );
  private static readonly RETRY_AFTER_RESTART_MS = parseInt(
    process.env.WATCHDOG_RETRY_MS ?? "5000",
    10,
  );

  private readonly logger = new Logger(GameWatchdogService.name);

  /** Reflète le dernier résultat connu des health checks */
  private readonly healthy$ = new BehaviorSubject<boolean>(true);
  /** Reflète si une séquence de relance est en cours */
  private readonly restartingSubject = new BehaviorSubject<boolean>(false);
  /** Émet à chaque changement de l'état "en cours de relance" */
  public readonly restarting$ = this.restartingSubject.asObservable();

  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private consecutiveFailures = 0;
  private restarting = false;

  constructor(
    private readonly botHttpService: BotHttpService,
    private readonly twitchActionDecider: TwitchActionDeciderService,
    private readonly autosaveService: AutosaveService,
  ) {}

  public async onModuleInit(): Promise<void> {
    // Attend la connexion initiale (gérée par BotHttpService) avant de surveiller
    await this.botHttpService.awaitInit();
    this.checkTimer = setInterval(
      () => void this.checkHealth(),
      GameWatchdogService.CHECK_INTERVAL_MS,
    );
  }

  public onModuleDestroy(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /** `true` si une relance du jeu est actuellement en cours */
  public isRestarting(): boolean {
    return this.restartingSubject.value;
  }

  /**
   * Déclenche manuellement une séquence de relance, comme si le watchdog
   * avait détecté un plantage (utile pour tester, voir `AdminController` /
   * la commande `redemarrer` de `command-emulation.ts`). Sans effet si une
   * relance est déjà en cours.
   */
  public triggerRestart(): Promise<void> {
    return this.restartGame();
  }

  /** Résout dès que l'API BalatroBot répond de nouveau normalement */
  public async awaitHealthy(): Promise<void> {
    if (this.healthy$.value) {
      return;
    }
    await firstValueFrom(this.healthy$.pipe(filter((v) => v)));
  }

  private async checkHealth(): Promise<void> {
    if (this.restarting) {
      return;
    }
    try {
      await this.botHttpService.sendRequest({ method: BotMethod.HEALTH });
      if (this.consecutiveFailures > 0) {
        this.logger.log("L'API BalatroBot est de nouveau joignable");
      }
      this.consecutiveFailures = 0;
      if (!this.healthy$.value) {
        this.healthy$.next(true);
      }
    } catch (err) {
      this.consecutiveFailures++;
      this.logger.warn(
        `Health check BalatroBot échoué (${this.consecutiveFailures.toString()}/${GameWatchdogService.FAILURE_THRESHOLD.toString()}) : ${(err as Error).message}`,
      );
      if (this.consecutiveFailures >= GameWatchdogService.FAILURE_THRESHOLD) {
        this.healthy$.next(false);
        void this.restartGame();
      }
    }
  }

  private async restartGame(): Promise<void> {
    if (this.restarting) {
      return;
    }
    this.restarting = true;
    // IMPORTANT : on affiche d'abord le message de redémarrage sur l'overlay
    // (via l'abonnement de OverlaySocketService à restarting$) et on attend
    // explicitement avant de couper le jeu. L'overlay affiche une capture
    // vidéo de la fenêtre Balatro : si on tue le jeu trop tôt, le flux vidéo
    // pourrait furtivement montrer le bureau ou une autre fenêtre du PC
    // pendant la fermeture/réouverture. Ce délai garantit que le client a eu
    // le temps de recevoir l'événement et de masquer la capture derrière le
    // message avant que quoi que ce soit ne change à l'écran.
    this.restartingSubject.next(true);
    this.twitchActionDecider.pauseTimer();
    this.logger.error("Le jeu ne répond plus, relance en cours...");

    await sleep(GameWatchdogService.PRE_KILL_DELAY_MS);

    try {
      await execAsync("npm run kill-game");
    } catch (err) {
      this.logger.error(
        `L'arrêt du jeu a échoué : ${(err as Error).message}`,
      );
    }

    await sleep(GameWatchdogService.KILL_TO_LAUNCH_DELAY_MS);

    try {
      await execAsync("npm run launch-game");
    } catch (err) {
      this.logger.error(
        `La relance du jeu a échoué : ${(err as Error).message}`,
      );
    }

    await this.waitUntilBackOnline();

    // C'est ICI que la reprise de la sauvegarde en cours doit être gérée :
    // une fois le jeu confirmé de nouveau joignable, on recharge directement
    // la sauvegarde automatique (si elle existe) avant de considérer la
    // relance comme terminée. On ne peut pas se contenter de compter sur le
    // prochain passage de GameCycleService par l'état MENU : celui-ci peut
    // être bloqué en attente d'une action (vote Twitch/admin) issue d'avant
    // le plantage, et ne repasserait alors jamais par sa logique de reprise.
    try {
      const loaded = await this.autosaveService.loadIfPresent();
      if (loaded) {
        this.logger.log("Sauvegarde automatique rechargée après la relance du jeu.");
      } else {
        this.logger.log("Aucune sauvegarde automatique à recharger : le jeu redémarre au menu.");
      }
    } catch (err) {
      this.logger.error(
        `Échec du rechargement de la sauvegarde après la relance : ${(err as Error).message}`,
      );
    }

    this.consecutiveFailures = 0;
    this.healthy$.next(true);
    this.restartingSubject.next(false);
    this.restarting = false;
    this.twitchActionDecider.resumeTimer();
    this.logger.log("Le jeu a redémarré, l'API BalatroBot répond de nouveau");
  }

  private async waitUntilBackOnline(): Promise<void> {
    // Laisse le temps au jeu et au mod de démarrer avant de sonder à nouveau
    await sleep(GameWatchdogService.RETRY_AFTER_RESTART_MS);
    while (true) {
      try {
        await this.botHttpService.sendRequest({ method: BotMethod.HEALTH });
        return;
      } catch {
        await sleep(GameWatchdogService.CHECK_INTERVAL_MS);
      }
    }
  }
}

