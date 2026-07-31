import {Component, computed, inject} from "@angular/core";
import {TwitchVoteSocket} from "../../../services/twitch-vote-socket";
import {CardComponent} from '../../card.component';

@Component({
  selector: "app-vote-count",
  host: {class: "block"},
  template: `
    <app-card title="Votes">
      <!--      @for (entry of voteCounts(); track entry.label) {-->
      <!--        <div class="flex gap-2 justify-between items-baseline">-->
      <!--          <div class="text-[24px]">{{ entry.label }}</div>-->
      <!--          <div class="text-[22px] font-bold">{{ entry.count }}</div>-->
      <!--        </div>-->
      <!--      } @empty {-->
      <!--        <div class="text-[20px] italic opacity-70">Aucun vote pour l'instant</div>-->
      <!--      }-->

      @if (totalVoteCount() > 0) {
        <div class="text-[22px]">
          <span class="font-bold">{{ totalVoteCount() }}</span> vote{{ totalVoteCount() > 1 ? 's' : '' }}
        </div>
      } @else {
        <div class="text-[20px] italic opacity-70">Aucun vote pour l'instant</div>
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
}

