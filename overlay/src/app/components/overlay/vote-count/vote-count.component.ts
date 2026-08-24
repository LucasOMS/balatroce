import {Component, computed, inject} from "@angular/core";
import {TwitchVoteSocket} from "../../../services/twitch-vote-socket";
import {CardComponent} from '../../card.component';
import {formatPerformedAction} from '../../../utils/performed-action-display';

@Component({
  selector: "app-vote-count",
  host: {class: "block"},
  template: `
    <app-card class="h-[80px] [--card-padding:8px] px-2! gap-0!">
      <div class="flex gap-[1ch] items-end mb-1">
        <div class="text-[20px]/[20px]">{{ title() }}</div>
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 40 40" class="size-2">
          <rect fill="var(--color-shadow)" x="1.3" y="19.3" width="6.7" height="15.5" />
          <rect fill="var(--color-shadow)" x="11.5" y="8.3" width="6.7" height="26.5" />
          <rect fill="var(--color-shadow)" x="21.8" y="13.1" width="6.7" height="21.8" />
          <rect fill="var(--color-shadow)" x="32" y="24.7" width="6.7" height="10.1" />
          <rect fill="var(--color-primary-500)" x="1.3" y="15.9" width="6.7" height="15.1" />
          <rect fill="var(--color-primary-500)" x="11.5" y="5.2" width="6.7" height="25.9" />
          <rect fill="var(--color-primary-500)" x="21.8" y="9.8" width="6.7" height="21.3" />
          <rect fill="var(--color-primary-500)" x="32" y="21.2" width="6.7" height="9.9" />
        </svg>
      </div>
      <hr class="border-b-1 border-(--card-shadow) mb-0.5" />

      @if (totalVoteCount() > 0) {
        <div class="text-[18px]">
          <span class="font-bold">{{ totalVoteCount() }}</span> vote{{ totalVoteCount() > 1 ? 's' : '' }}
        </div>
      } @else if (lastPerformedActionParts().length > 0) {
        <div class="text-[18px] vote-winner-flash whitespace-nowrap">
          @for (part of lastPerformedActionParts(); track $index) {
            @if (part.kind === 'playing-card') {
              <span
                class="inline-flex items-center rounded bg-white px-0.5 font-bold"
                [class.text-red-600]="part.color === 'red'"
                [class.text-black]="part.color === 'black'">
                {{ part.rank }}{{ part.suit }}
              </span>
            } @else {
              <span>{{ part.text }}</span>
            }
          }
        </div>
      } @else {
        <div class="text-[18px] italic opacity-70">Aucun vote pour l'instant</div>
      }
    </app-card>
  `,
  imports: [
    CardComponent
  ]
})
export class VoteCountComponent {
  private readonly twitchVoteSocket = inject(TwitchVoteSocket);

  protected readonly voteCounts = computed(() => this.twitchVoteSocket.voteInfo()?.voteCounts ?? []);

  protected readonly totalVoteCount = computed(() =>
    this.voteCounts().reduce((total, voteCount) => total + voteCount.count, 0)
  );

  protected readonly lastPerformedActionParts = computed(() => {
    const action = this.twitchVoteSocket.voteInfo()?.lastPerformedAction;
    return action ? formatPerformedAction(action) : [];
  });

  protected readonly title = computed(() =>
    this.totalVoteCount() === 0 && this.lastPerformedActionParts().length > 0
      ? "Action réalisée"
      : "Votes"
  );
}
