import {Component, computed, inject} from "@angular/core";
import {TwitchVoteSocket} from "../../../services/twitch-vote-socket";
import {CardComponent} from '../../card.component';
import {formatPerformedAction} from '../../../utils/performed-action-display';

@Component({
  selector: "app-vote-count",
  host: {class: "block"},
  template: `
    <app-card class="h-[80px] [--card-padding:8px] px-2! gap-0!">
      <div class="text-[20px]/[20px] mb-1">{{ title() }}</div>
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
                class="inline-flex items-center rounded bg-white px-1 font-bold"
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
