import {Component, computed, DestroyRef, inject, signal, ViewEncapsulation} from "@angular/core";
import {TwitchVoteSocket} from "../../../services/twitch-vote-socket";
import {VoteTimerState} from "@shared/timer-state";
import {SquareProgressComponent} from './square-progress.component';

@Component({
  selector: "app-delay-count",
  host: {class: "block"},
  template: `
    @if (visible()) {
      <app-square-progress
        [progression]="progression()"
        [radius]="8"
        thickness="8"
        class="rounded-[16px] overflow-hidden"
        [style.--frame-color]="'white'"
        [style.--progress-color]="state() === VoteTimerState.RUNNING ? 'var(--color-primary-500)' : 'var(--color-between-vote)'"
      ></app-square-progress>
    }
  `,
  encapsulation: ViewEncapsulation.None,
  imports: [
    SquareProgressComponent
  ]
})
export class DelayCountComponent {
  private readonly twitchVoteSocket = inject(TwitchVoteSocket);

  /**
   * Recalculé en continu (à chaque frame) pour faire avancer la
   * progression du chrono avec précision. Utilise l'horloge serveur
   * estimée (`serverNow()`) plutôt que `Date.now()` directement, pour
   * éviter tout décalage dû à une dérive entre l'horloge du serveur et
   * celle du client.
   */
  private readonly now = signal(this.twitchVoteSocket.serverNow());

  protected readonly VoteTimerState = VoteTimerState;

  protected readonly state = computed(() => this.twitchVoteSocket.voteInfo()?.state ?? VoteTimerState.STOPPED);
  protected readonly endTimestamp = computed(() => this.twitchVoteSocket.voteInfo()?.endTimestamp ?? null);

  protected readonly visible = computed(() => this.state() !== VoteTimerState.STOPPED && this.endTimestamp() !== null);

  protected readonly label = computed(() =>
    this.state() === VoteTimerState.RUNNING ? "Vote en cours" : "Prochain vote dans",
  );

  protected readonly totalDuration = computed<number>(() => {
    switch (this.state()) {
      case VoteTimerState.RUNNING:
        return DelayCountComponent.VOTE_DURATION_MS;
      case VoteTimerState.DELAY:
        return DelayCountComponent.DELAY_DURATION_MS;
      default:
        return 0;
    }
  });

  /** Progression du décompte, de 0 (début) à 1 (temps écoulé). */
  protected readonly progression = computed(() => {
    const end = this.endTimestamp();
    const total = this.totalDuration();
    if (end === null || total <= 0) {
      return 0;
    }
    const remaining = Math.max(0, end - this.now());
    return Math.min(1, Math.max(0, 1 - remaining / total));
  });

  constructor() {
    // Boucle rAF plutôt qu'un setInterval périodique : la progression doit
    // être une fonction continue et exacte du temps réel, pas une
    // approximation rafraîchie par à-coups — c'est ce qui garantit que les
    // segments de app-square-progress s'enchaînent sans décalage ni lissage
    // artificiel nécessaire.
    let rafId: number;
    const tick = (): void => {
      this.now.set(this.twitchVoteSocket.serverNow());
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(rafId));
  }

  /** Durée (ms) de la phase de vote, doit rester synchronisée avec TWITCH_VOTE_DURATION_MS côté serveur */
  private static readonly VOTE_DURATION_MS = 25000;
  /** Durée (ms) de la phase de délai avant le prochain vote, doit rester synchronisée avec TWITCH_VOTE_DELAY_MS côté serveur */
  private static readonly DELAY_DURATION_MS = 7500;
}

