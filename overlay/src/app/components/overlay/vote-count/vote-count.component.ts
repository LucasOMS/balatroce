import {Component, computed, inject} from "@angular/core";
import {TwitchVoteSocket} from "../../../services/twitch-vote-socket";
import {CardComponent} from '../../card.component';

@Component({
  selector: "app-vote-count",
  host: {class: "block"},
  template: `
    <app-card class="h-[80px] [--card-padding:8px] px-2! gap-0!">
      <div class="text-[20px]/[20px] mb-1">Votes</div>
      <hr class="border-b-1 border-(--card-shadow) mb-0.5" />

      @if (totalVoteCount() > 0) {
        <div class="text-[18px]">
          <span class="font-bold">{{ totalVoteCount() }}</span> vote{{ totalVoteCount() > 1 ? 's' : '' }}
        </div>
      } @else {
        @for (winner of lastWinner(); track winner.key) {
          <div class="text-[18px] vote-winner-flash">{{ winner.label }}</div>
        } @empty {
          <div class="text-[18px] italic opacity-70">Aucun vote pour l'instant</div>
        }
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

  /**
   * Dernière commande gagnante (affichée pendant la transition entre deux
   * votes, à la place de "Aucun vote pour l'instant"). La clé inclut
   * `endTimestamp` pour forcer le navigateur à recréer l'élément (et donc
   * rejouer l'animation d'apparition) à chaque nouveau cycle de vote, même
   * si le libellé gagnant est identique au précédent.
   */
  protected readonly lastWinner = computed(() => {
    const info = this.twitchVoteSocket.voteInfo();
    if (!info?.lastWinningLabel) {
      return [];
    }
    return [{label: info.lastWinningLabel, key: `${info.endTimestamp ?? 0}-${info.lastWinningLabel}`}];
  });
}


