import {Component, computed, DestroyRef, inject, signal} from "@angular/core";
import {TwitchVoteSocket} from "../../../services/twitch-vote-socket";
import {VoteTimerState} from "@shared/timer-state";

@Component({
  selector: "app-delay-count",
  host: {class: "block"},
  template: `
    @if (visible()) {
      <div class="absolute top-10 left-1.5 bg-black/80 text-white px-4 py-2 rounded-[16px] border-4 border-white">
        <div class="text-[20px] opacity-80">{{ label() }}</div>
        <div class="text-[40px] font-bold text-center">{{ formattedRemaining() }}</div>
      </div>
    }
  `,
})
export class DelayCountComponent {
  private readonly twitchVoteSocket = inject(TwitchVoteSocket);

  /** Recalculé toutes les 200ms pour faire tourner le chrono */
  private readonly now = signal(Date.now());

  protected readonly VoteTimerState = VoteTimerState;

  protected readonly state = computed(() => this.twitchVoteSocket.voteInfo()?.state ?? VoteTimerState.STOPPED);
  protected readonly endTimestamp = computed(() => this.twitchVoteSocket.voteInfo()?.endTimestamp ?? null);

  protected readonly visible = computed(() => this.state() !== VoteTimerState.STOPPED && this.endTimestamp() !== null);

  protected readonly label = computed(() =>
    this.state() === VoteTimerState.RUNNING ? "Vote en cours" : "Prochain vote dans",
  );

  protected readonly remainingSeconds = computed(() => {
    const end = this.endTimestamp();
    if (end === null) {
      return 0;
    }
    return Math.max(0, Math.ceil((end - this.now()) / 1000));
  });

  protected readonly formattedRemaining = computed(() => {
    const total = this.remainingSeconds();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  });

  constructor() {
    const intervalId = setInterval(() => this.now.set(Date.now()), 200);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalId));
  }
}

