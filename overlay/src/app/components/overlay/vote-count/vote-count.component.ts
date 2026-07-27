import {Component, computed, inject} from "@angular/core";
import {TwitchVoteSocket} from "../../../services/twitch-vote-socket";
import {CardComponent} from '../../card.component';

@Component({
  selector: "app-vote-count",
  host: {class: "block"},
  template: `
    <app-card title="Votes" class="absolute top-10 right-1.5 min-w-[260px]">
      @for (entry of voteCounts(); track entry.label) {
        <div class="flex gap-2 justify-between items-baseline">
          <div class="text-[24px]">{{ entry.label }}</div>
          <div class="text-[22px] font-bold">{{ entry.count }}</div>
        </div>
      } @empty {
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
}

