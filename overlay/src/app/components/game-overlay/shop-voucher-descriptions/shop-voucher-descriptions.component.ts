import {Component, computed, input} from "@angular/core";
import {Area} from "@shared/game-state";

@Component({
  selector: "app-shop-voucher-descriptions",
  host: {class: "block"},
  template: `
    @if (count() === 1) {
      <div class="voucher-count-{{ count() }}">
        @for (voucherDesc of descriptions(); track voucherDesc) {
          @if (voucherDesc.length > 0) {
            <div class="absolute w-21 h-35 text-white bg-black/80 p-1 flex items-center justify-center rounded-[16px] border-4 border-white text-center text-[24px]">
              <span>{{ voucherDesc }}</span>
            </div>
          }
        }
      </div>
    }
  `,

  styles: `
    .voucher-count-1 {
      > :nth-child(1){
        bottom: 85px;
        font-size: 24px;
        left: 592px;
      }
    }
  `
})
export class ShopVoucherDescriptionsComponent {
  readonly vouchers = input.required<Area>();

  protected readonly count = computed(() => this.vouchers().count ?? 0);

  protected readonly descriptions = computed<string[]>(() => {
    const cards = this.vouchers().cards;
    if (!cards) {
      return [];
    }
    return cards.map(card => card.value.effect ?? '');
  });

}

