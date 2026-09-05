import {Component, computed, inject, input} from "@angular/core";
import {Card} from "@shared/game-state";
import {CardComponent} from '../../card.component';
import {getCardDescription} from '../../../const/card-descriptions';
import {OverlaySocket} from '../../../services/overlay-socket';

@Component({
  selector: "app-shop-card-descriptions",
  host: {class: "block"},
  template: `
    @if (count() <= 3 && count() > 0) {
      <div class="card-count-{{ count() }}">
        @for (desc of descriptions(); track desc) {
          @if (desc.length > 0) {
            <app-card class="absolute w-21 h-35 flex items-center justify-center text-center text-[24px]">
              <span [innerHTML]="desc"></span>
            </app-card>
          }
        }
      </div>
    }
  `,
  imports: [
    CardComponent
  ],

  styles: `
    .error-message {
      position: absolute;
      bottom: 280px;
      left: 598px;
      color: white;
      font-size: 26px;
      text-align: center;
      line-height: 28px;
      width: 672px;
    }

    :host > * > * {
      width: 160px;
    }

    .card-count-1 {
      > :nth-child(1) {
        bottom: 415px;
        left: 930px;
      }
    }

    .card-count-2 {
      > :nth-child(1) {
        bottom: 415px;
        left: 838px;
      }

      > :nth-child(2) {
        bottom: 415px;
        left: 1347px;
      }
    }

    .card-count-3 {
      > * {
        bottom: 441px;
        height: 223px;
      }

      > :nth-child(1) {
        left: 920px;
      }

      > :nth-child(2) {
        left: 1097px;
      }

      > :nth-child(3) {
        left: 1272px;
      }
    }
  `
})
export class ShopCardDescriptionsComponent {
  private readonly overlaySocket = inject(OverlaySocket);

  readonly shopCards = input<Card[]>([]);

  protected readonly count = computed(() => this.shopCards()?.length ?? 0);

  protected readonly descriptions = computed<string[]>(() => {
    const cards = this.shopCards();
    if (!cards) {
      return [];
    }
    return cards.map(card => getCardDescription(card, this.overlaySocket.overlayInfo()?.gameState?.hands));
  });
}

