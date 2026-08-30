import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { merge, Observable, Subject } from "rxjs";
import { ChatAction } from "../interfaces/chat-action";
import { parseAllParser } from "../parsers/parse-all.parser";
import { TwitchMessageCollectorService } from "./twitch-message-collector.service";
import { canonicalizeAction } from "./twitch/action-canonicalizer";
import { VoteEntry, VoteStrategy } from "./twitch/vote-strategy.interface";
import { DemocracyStrategy } from "./twitch/democracy-strategy";
import { AnarchyStrategy } from "./twitch/anarchy-strategy";
import { VoteTimerState } from "../../shared/timer-state";
import { TwitchVoteInfo } from "../../shared/twitch-vote-info";
import { ActionMode } from "../../shared/action-mode";
import { PerformedAction } from "../../shared/performed-action";
import { ModeManagerService } from "./mode-manager.service";

/**
 * Décide quelle(s) action(s) effectuer à partir des messages du chat collectés
 * par TwitchMessageCollectorService, et maintient le timer de vote.
 *
 * La stratégie de vote (démocratie ou anarchie) est déterminée à chaque fin de
 * vote par le mode courant (ModeManagerService), qui change automatiquement
 * après un certain temps ou immédiatement si un montant de dons suffisant est
 * atteint.
 *
 * Variables d'environnement :
 * - TWITCH_VOTE_DURATION_MS : durée (ms) de la phase de vote (défaut 25000)
 * - TWITCH_VOTE_DELAY_MS : durée (ms) de la phase de délai entre deux votes,
 *   pour laisser passer les messages "en retard" (défaut 7500)
 */
@Injectable()
export class TwitchActionDeciderService implements OnModuleDestroy {
  static readonly VOTE_DURATION_MS = parseInt(process.env.TWITCH_VOTE_DURATION_MS ?? "25000", 10);
  static readonly DELAY_DURATION_MS = parseInt(process.env.TWITCH_VOTE_DELAY_MS ?? "7500", 10);

  private readonly logger = new Logger(TwitchActionDeciderService.name);

  private state: VoteTimerState = VoteTimerState.STOPPED;
  private endTimestamp: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private looping = false;
  /** `true` si le timer a été mis en pause (ex: relance du jeu en cours) */
  private paused = false;
  private lastPerformedAction: PerformedAction | null = null;

  private readonly actionsResultSubject = new Subject<ChatAction[]>();
  /** Émet la liste des actions à effectuer (par ordre de préférence) à la fin de chaque vote */
  public readonly actionsResult$ = this.actionsResultSubject.asObservable();

  private readonly stateChangeSubject = new Subject<void>();
  /** Émet à chaque fois que l'état du timer ou le décompte des votes change */
  public readonly voteInfoChanged$: Observable<unknown>;

  private readonly voteEndedSubject = new Subject<void>();
  /**
   * Émet à chaque fin de vote (avant même de savoir si une action valide en
   * ressort). Sert notamment à déclencher un renvoi de l'état courant complet
   * à l'overlay, pour qu'un éventuel état "invalide" se répare automatiquement
   * au plus tard au bout d'un cycle de vote.
   */
  public readonly voteEnded$ = this.voteEndedSubject.asObservable();

  constructor(
    private readonly collector: TwitchMessageCollectorService,
    private readonly modeManagerService: ModeManagerService,
  ) {
    this.voteInfoChanged$ = merge(this.stateChangeSubject.asObservable(), this.collector.newMessages$);
  }

  /** Stratégie à utiliser pour le prochain vote, décidée par le mode courant */
  private getStrategy(): VoteStrategy {
    return this.modeManagerService.getCurrentMode() === ActionMode.Anarchy
      ? new AnarchyStrategy()
      : new DemocracyStrategy();
  }

  public onModuleDestroy(): void {
    this.stopTimer();
  }

  /** Démarre (ou reprend) le cycle de vote. Sans effet si déjà démarré. */
  public startTimer(): void {
    if (this.state !== VoteTimerState.STOPPED) {
      return;
    }
    this.looping = true;
    this.runVotePhase();
  }

  /** Arrête définitivement le cycle de vote. */
  public stopTimer(): void {
    this.looping = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.state = VoteTimerState.STOPPED;
    this.endTimestamp = null;
    this.collector.setAcceptingVotes(false);
    this.stateChangeSubject.next();
  }

  /**
   * Met en pause le cycle de vote (ex: pendant la relance du jeu suite à un
   * plantage détecté). Sans effet si déjà en pause. N'arrête pas
   * définitivement le cycle : {@link resumeTimer} le reprend là où il en était.
   */
  public pauseTimer(): void {
    if (this.paused) {
      return;
    }
    this.paused = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.state = VoteTimerState.STOPPED;
    this.endTimestamp = null;
    this.collector.setAcceptingVotes(false);
    this.stateChangeSubject.next();
  }

  /** Reprend le cycle de vote mis en pause par {@link pauseTimer}. Sans effet sinon. */
  public resumeTimer(): void {
    if (!this.paused) {
      return;
    }
    this.paused = false;
    if (this.looping) {
      this.runVotePhase();
    }
  }

  public getState(): VoteTimerState {
    return this.state;
  }

  public getEndTimestamp(): number | null {
    return this.endTimestamp;
  }

  public setLastPerformedAction(action: PerformedAction | null): void {
    this.lastPerformedAction = action;
    this.stateChangeSubject.next();
  }

  /** Construit les informations de vote à envoyer au front (indépendamment du reste de l'overlay) */
  public getCurrentVoteInfo(): TwitchVoteInfo {
    const entries = this.computeVoteEntries();
    return {
      state: this.state,
      endTimestamp: this.endTimestamp,
      voteCounts: [...entries]
        .sort((a, b) => b.count - a.count)
        .map((entry) => ({ label: entry.label, count: entry.count })),
      lastPerformedAction: this.lastPerformedAction,
    };
  }

  private runVotePhase(): void {
    this.state = VoteTimerState.RUNNING;
    this.endTimestamp = Date.now() + TwitchActionDeciderService.VOTE_DURATION_MS;
    this.lastPerformedAction = null;
    // Seule la phase RUNNING doit comptabiliser les messages du chat comme
    // des votes : on autorise leur enregistrement maintenant, et on le
    // désactivera dès la fin de cette phase (voir onVoteEnd).
    this.collector.setAcceptingVotes(true);
    this.stateChangeSubject.next();
    this.timer = setTimeout(() => this.onVoteEnd(), TwitchActionDeciderService.VOTE_DURATION_MS);
  }

  private onVoteEnd(): void {
    // On coupe immédiatement la prise en compte de nouveaux messages : la
    // phase DELAY qui suit ne sert qu'à afficher le résultat du vote clos,
    // pas à commencer à compter les votes du prochain tour.
    this.collector.setAcceptingVotes(false);

    const entries = this.computeVoteEntries();
    const orderedEntries = this.getStrategy().decide(entries);
    this.logger.log(`Fin du vote : ${orderedEntries.length.toString()} action(s) ordonnée(s)`);
    this.actionsResultSubject.next(orderedEntries.map((entry) => entry.action));
    this.collector.clear();
    this.voteEndedSubject.next();

    this.state = VoteTimerState.DELAY;
    this.endTimestamp = Date.now() + TwitchActionDeciderService.DELAY_DURATION_MS;
    this.stateChangeSubject.next();
    this.timer = setTimeout(() => this.onDelayEnd(), TwitchActionDeciderService.DELAY_DURATION_MS);
  }

  private onDelayEnd(): void {
    if (this.looping) {
      this.runVotePhase();
      return;
    }
    this.state = VoteTimerState.STOPPED;
    this.endTimestamp = null;
    this.stateChangeSubject.next();
  }

  /** Compte les messages en cours, unifiés par action canonique */
  private computeVoteEntries(): VoteEntry[] {
    const grouped = new Map<string, VoteEntry>();

    for (const message of this.collector.getMessages().values()) {
      const action = parseAllParser(message);
      if (!action) {
        continue;
      }

      const { key, canonicalAction } = canonicalizeAction(action);
      const existing = grouped.get(key);
      if (existing) {
        existing.count++;
      } else {
        grouped.set(key, { key, action: canonicalAction, label: message, count: 1 });
      }
    }

    return [...grouped.values()];
  }
}


