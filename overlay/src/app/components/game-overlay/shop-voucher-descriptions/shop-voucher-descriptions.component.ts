import {Component, computed, inject, input} from "@angular/core";
import {Area} from "@shared/game-state";
import {CardComponent} from '../../card.component';
import {getCardDescription} from '../../../const/card-descriptions';
import {OverlaySocket} from '../../../services/overlay-socket';

@Component({
  selector: "app-shop-voucher-descriptions",
  host: {class: "block"},
  template: `
    @if (count() === 1) {
      <div class="voucher-count-{{ count() }}">
        @for (voucherDesc of descriptions(); track voucherDesc) {
          @if (voucherDesc.length > 0) {
            <app-card class="absolute w-21 h-35 flex items-center justify-center text-center text-[24px]">
              <span [innerHTML]="voucherDesc"></span>
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
    .voucher-count-1 {
      > :nth-child(1) {
        bottom: 85px;
        font-size: 24px;
        left: 592px;
      }
    }
  `
})
export class ShopVoucherDescriptionsComponent {
  private readonly overlaySocket = inject(OverlaySocket);

  readonly vouchers = input.required<Area>();

  protected readonly count = computed(() => this.vouchers().count ?? 0);

  protected readonly descriptions = computed<string[]>(() => {
    const cards = this.vouchers().cards;
    if (!cards) {
      return [];
    }
    return cards.map(card => getCardDescription(card, this.overlaySocket.overlayInfo()?.gameState?.hands));
  });

}

