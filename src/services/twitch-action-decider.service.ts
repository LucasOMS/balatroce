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

/**
 * Décide quelle(s) action(s) effectuer à partir des messages du chat collectés
 * par TwitchMessageCollectorService, et maintient le timer de vote.
 *
 * Variables d'environnement :
 * - TWITCH_VOTE_DURATION_MS : durée (ms) de la phase de vote (défaut 20000)
 * - TWITCH_VOTE_DELAY_MS : durée (ms) de la phase de délai entre deux votes,
 *   pour laisser passer les messages "en retard" (défaut 5000)
 * - TWITCH_VOTE_STRATEGY : "democracy" (défaut) ou "anarchy"
 */
@Injectable()
export class TwitchActionDeciderService implements OnModuleDestroy {
  static readonly VOTE_DURATION_MS = parseInt(process.env.TWITCH_VOTE_DURATION_MS ?? "20000", 10);
  static readonly DELAY_DURATION_MS = parseInt(process.env.TWITCH_VOTE_DELAY_MS ?? "5000", 10);
  static readonly STRATEGY_NAME = (process.env.TWITCH_VOTE_STRATEGY ?? "democracy").toLowerCase();

  private readonly logger = new Logger(TwitchActionDeciderService.name);

  private readonly strategy: VoteStrategy =
    TwitchActionDeciderService.STRATEGY_NAME === "anarchy"
      ? new AnarchyStrategy()
      : new DemocracyStrategy();

  private state: VoteTimerState = VoteTimerState.STOPPED;
  private endTimestamp: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private looping = false;

  private readonly actionsResultSubject = new Subject<ChatAction[]>();
  /** Émet la liste des actions à effectuer (par ordre de préférence) à la fin de chaque vote */
  public readonly actionsResult$ = this.actionsResultSubject.asObservable();

  private readonly stateChangeSubject = new Subject<void>();
  /** Émet à chaque fois que l'état du timer ou le décompte des votes change */
  public readonly voteInfoChanged$: Observable<unknown>;

  constructor(private readonly collector: TwitchMessageCollectorService) {
    this.voteInfoChanged$ = merge(this.stateChangeSubject.asObservable(), this.collector.newMessages$);
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
    this.stateChangeSubject.next();
  }

  public getState(): VoteTimerState {
    return this.state;
  }

  public getEndTimestamp(): number | null {
    return this.endTimestamp;
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
    };
  }

  private runVotePhase(): void {
    this.state = VoteTimerState.RUNNING;
    this.endTimestamp = Date.now() + TwitchActionDeciderService.VOTE_DURATION_MS;
    this.stateChangeSubject.next();
    this.timer = setTimeout(() => this.onVoteEnd(), TwitchActionDeciderService.VOTE_DURATION_MS);
  }

  private onVoteEnd(): void {
    const entries = this.computeVoteEntries();
    const orderedActions = this.strategy.decide(entries);
    this.logger.log(`Fin du vote : ${orderedActions.length.toString()} action(s) ordonnée(s)`);
    this.actionsResultSubject.next(orderedActions);
    this.collector.clear();

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

