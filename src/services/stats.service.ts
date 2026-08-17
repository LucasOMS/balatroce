import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import * as fs from "node:fs";
import * as path from "node:path";
import { ActionMode } from "../../shared/action-mode";
import { ModeManagerService } from "./mode-manager.service";
import { GameState } from "../interfaces/game-state";

/** Intervalle (ms) auquel le temps passé dans le mode courant (anarchie/démocratie) est comptabilisé */
const MODE_TICK_INTERVAL_MS = 15_000;

/** Intervalle (ms) entre deux écritures du (petit) fichier de statistiques agrégées sur disque */
const FLUSH_INTERVAL_MS = 10_000;

/**
 * État persisté des statistiques **agrégées** : uniquement des compteurs
 * bornés (une douzaine de clés maximum), jamais une structure qui grossit
 * avec le nombre de participants (voir le journal des joueurs séparé,
 * `PLAYER_LOG_FILE`, pour ça).
 */
interface PersistedStats {
  /** Nombre total de commandes de vote reçues du chat (tous joueurs confondus, depuis toujours) */
  totalVotes: number;
  /** Montant total de dons récoltés depuis toujours (recopié depuis ModeManagerService à chaque sauvegarde) */
  totalDonations: number;
  /** Temps cumulé (ms) passé en mode anarchie depuis toujours */
  anarchyTimeMs: number;
  /** Temps cumulé (ms) passé en mode démocratie depuis toujours */
  democracyTimeMs: number;
  /** Nombre de parties (decks) gagnées depuis toujours */
  gamesWon: number;
  /** Nombre de parties (decks) perdues depuis toujours */
  gamesLost: number;
  /** Nombre de fois où chaque type de main a été joué (clé = `HandType`, ex: "Three of a Kind") */
  handsPlayed: Record<string, number>;
}

function defaultStats(): PersistedStats {
  return {
    totalVotes: 0,
    totalDonations: 0,
    anarchyTimeMs: 0,
    democracyTimeMs: 0,
    gamesWon: 0,
    gamesLost: 0,
    handsPlayed: {},
  };
}

/**
 * Collecte et persiste les statistiques globales de la chaîne. Pensé pour
 * rester bon marché même avec des milliers de participants uniques et un
 * stream de plusieurs heures, via deux mécanismes bien distincts :
 *
 * 1. **Commandes des joueurs** (`PLAYER_LOG_FILE`) : un simple fichier texte
 *    en *append* (une ligne = un pseudo), jamais réécrit intégralement.
 *    Contrairement à un objet JSON `{pseudo: nombre}` qu'il faudrait
 *    resérialiser et réécrire en entier à CHAQUE commande (de plus en plus
 *    coûteux au fil du stream, à mesure que la map grossit), le coût d'un
 *    append ne dépend pas de la taille déjà présente sur le disque : on se
 *    contente d'ajouter quelques octets à la fin du fichier, en asynchrone
 *    (`fs.promises.appendFile`, non-bloquant pour l'event loop). Le nombre de
 *    joueurs uniques, le podium des plus actifs, etc. ne sont volontairement
 *    PAS calculés en continu : ils se déduisent en relisant ce fichier une
 *    seule fois, à la demande, via `npm run stats:report`
 *    (`src/scripts/stats-report.ts`).
 *
 * 2. **Statistiques agrégées** (`STATS_FILE`) : un petit objet JSON borné
 *    (dons, temps de jeu, victoires/défaites, mains jouées par type — une
 *    douzaine de clés max, qui ne grossit jamais avec le nombre de
 *    participants). Les événements le mettent à jour en mémoire
 *    immédiatement, mais l'écriture sur disque n'est faite que
 *    périodiquement (`FLUSH_INTERVAL_MS`), pas à chaque événement : sa
 *    taille restant petite et fixe, ça reste de toute façon très bon marché,
 *    mais grouper les écritures évite des I/O disque à chaque commande de
 *    vote, changement de mode, etc.
 *
 * Variables d'environnement :
 * - STATS_PATH : chemin du fichier de statistiques agrégées (défaut `data/stats.json`)
 * - STATS_PLAYER_LOG_PATH : chemin du journal des commandes joueurs (défaut `data/player-commands.log`)
 */
@Injectable()
export class StatsService implements OnModuleInit, OnModuleDestroy {
  private static readonly STATS_FILE =
    process.env.STATS_PATH ?? path.join(process.cwd(), "data", "stats.json");

  private static readonly PLAYER_LOG_FILE =
    process.env.STATS_PLAYER_LOG_PATH ?? path.join(process.cwd(), "data", "player-commands.log");

  private readonly logger = new Logger(StatsService.name);
  private stats: PersistedStats = defaultStats();
  /** `true` si des changements en mémoire n'ont pas encore été écrits sur disque */
  private dirty = false;

  private modeTickTimer: ReturnType<typeof setInterval> | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private lastTickAt = Date.now();

  /** Dernier décompte connu de mains jouées par type (pour ne comptabiliser que les incréments) */
  private readonly lastHandsPlayed = new Map<string, number>();

  constructor(private readonly modeManagerService: ModeManagerService) {}

  public onModuleInit(): void {
    this.stats = this.load();
    try {
      fs.mkdirSync(path.dirname(StatsService.PLAYER_LOG_FILE), { recursive: true });
    } catch (err) {
      this.logger.warn(`Impossible de créer le dossier du journal des joueurs : ${(err as Error).message}`);
    }
    this.lastTickAt = Date.now();
    this.modeTickTimer = setInterval(() => this.tickModeTime(), MODE_TICK_INTERVAL_MS);
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  public onModuleDestroy(): void {
    if (this.modeTickTimer) {
      clearInterval(this.modeTickTimer);
      this.modeTickTimer = null;
    }
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // Comptabilise le temps écoulé depuis le dernier tick, puis force une
    // dernière écriture avant l'arrêt (au cas où le dernier flush périodique
    // n'aurait pas encore eu lieu).
    this.tickModeTime();
    this.flush();
  }

  /**
   * À appeler à chaque commande de vote valide reçue d'un joueur du chat.
   * N'ajoute qu'une ligne au journal des joueurs (coût constant, indépendant
   * du nombre de joueurs déjà enregistrés) : aucune réécriture d'un gros
   * objet JSON n'est faite ici, contrairement à une map en mémoire.
   */
  public recordPlayerCommand(username: string): void {
    this.stats.totalVotes++;
    this.dirty = true;

    const sanitized = username.replace(/[\r\n]/g, " ").trim();
    if (!sanitized) {
      return;
    }
    fs.promises.appendFile(StatsService.PLAYER_LOG_FILE, `${sanitized}\n`, "utf-8").catch((err: Error) => {
      this.logger.warn(`Impossible d'enregistrer la commande du joueur "${sanitized}" : ${err.message}`);
    });
  }

  /** À appeler à chaque fin de partie (deck gagné ou perdu). */
  public recordGameOver(won: boolean): void {
    if (won) {
      this.stats.gamesWon++;
    } else {
      this.stats.gamesLost++;
    }
    this.dirty = true;
  }

  /**
   * À appeler à chaque récupération d'un `GameState` : détecte les mains
   * nouvellement jouées via le compteur `hands[type].played` renvoyé par le
   * jeu, et n'ajoute que les incréments positifs (un compteur qui redescend
   * signale un nouveau run, on ne décrémente jamais les statistiques).
   */
  public recordGameState(gameState: GameState): void {
    if (!gameState.hands) {
      return;
    }
    for (const [handType, info] of Object.entries(gameState.hands)) {
      const previous = this.lastHandsPlayed.get(handType) ?? 0;
      const current = info.played ?? 0;
      if (current > previous) {
        this.stats.handsPlayed[handType] = (this.stats.handsPlayed[handType] ?? 0) + (current - previous);
        this.dirty = true;
      }
      this.lastHandsPlayed.set(handType, current);
    }
  }

  /** Copie des statistiques agrégées actuelles (utilisé par les tests / un éventuel endpoint de debug). */
  public getSnapshot(): PersistedStats {
    return JSON.parse(JSON.stringify(this.stats)) as PersistedStats;
  }

  /** Comptabilise le temps écoulé depuis le dernier tick dans le mode actuellement actif. */
  private tickModeTime(): void {
    const now = Date.now();
    const elapsed = now - this.lastTickAt;
    this.lastTickAt = now;
    if (elapsed <= 0) {
      return;
    }
    if (this.modeManagerService.getCurrentMode() === ActionMode.Anarchy) {
      this.stats.anarchyTimeMs += elapsed;
    } else {
      this.stats.democracyTimeMs += elapsed;
    }
    this.dirty = true;
  }

  private load(): PersistedStats {
    try {
      if (!fs.existsSync(StatsService.STATS_FILE)) {
        return defaultStats();
      }
      const raw = fs.readFileSync(StatsService.STATS_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<PersistedStats>;
      const stats: PersistedStats = {
        ...defaultStats(),
        ...parsed,
        handsPlayed: parsed.handsPlayed ?? {},
      };
      this.logger.log(`Statistiques chargées depuis ${StatsService.STATS_FILE}`);
      return stats;
    } catch (err) {
      this.logger.warn(`Impossible de charger les statistiques, on repart de zéro : ${(err as Error).message}`);
      return defaultStats();
    }
  }

  /** Écrit le (petit) fichier de statistiques agrégées sur disque, uniquement s'il a changé depuis le dernier flush. */
  private flush(): void {
    if (!this.dirty) {
      return;
    }
    this.dirty = false;
    try {
      // Le total de dons est simplement recopié depuis ModeManagerService
      // (source de vérité unique), pour éviter de dupliquer la logique de
      // comptage/anti-doublon des dons Streamlabs.
      this.stats.totalDonations = this.modeManagerService.getCurrentInfo().totalDonationAmount;

      fs.mkdirSync(path.dirname(StatsService.STATS_FILE), { recursive: true });
      fs.writeFileSync(StatsService.STATS_FILE, JSON.stringify(this.stats, null, 2), "utf-8");
    } catch (err) {
      this.logger.warn(`Impossible de sauvegarder les statistiques : ${(err as Error).message}`);
      // On retentera au prochain flush périodique.
      this.dirty = true;
    }
  }
}


