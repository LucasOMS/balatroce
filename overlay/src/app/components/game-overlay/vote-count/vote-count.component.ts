import {Component, computed, inject} from "@angular/core";
import {TwitchVoteSocket} from "../../../services/twitch-vote-socket";

@Component({
  selector: "app-vote-count",
  host: {class: "block"},
  template: `
    <div class="absolute top-10 right-1.5 bg-black/80 text-white p-2 rounded-[16px] border-4 border-white flex flex-col gap-1 min-w-[260px]">
      <div class="text-[22px] font-bold border-b border-white/30 pb-1 mb-1">Votes</div>
      @for (entry of voteCounts(); track entry.label) {
        <div class="flex gap-2 justify-between items-baseline">
          <div class="text-[24px]">{{ entry.label }}</div>
          <div class="text-[22px] font-bold">{{ entry.count }}</div>
        </div>
      } @empty {
        <div class="text-[20px] italic opacity-70">Aucun vote pour l'instant</div>
      }
    </div>
  `,
})
export class VoteCountComponent {
  private readonly twitchVoteSocket = inject(TwitchVoteSocket);

  protected readonly voteCounts = computed(() => this.twitchVoteSocket.voteInfo()?.voteCounts ?? []);
}

