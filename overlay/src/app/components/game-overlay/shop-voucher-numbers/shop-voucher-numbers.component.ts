import {Component, computed, input} from "@angular/core";
import {Area} from "@shared/game-state";

@Component({
  selector: "app-shop-voucher-numbers",
  host: {class: "block"},
  template: `
    @if (count() > 0 && count() < 3) {
      <div class="voucher-count-{{ count() }}">
        @for (num of numbers(); track num) {
          <div class="voucher-number text-outline-2">
            <span>{{ num }}</span>
          </div>
        }
      </div>
    }
  `,

  styles: `
    .voucher-number {
      font-size: 60px;
      color: white;
      position: absolute;
      height: 70px;
      display: grid;
      place-content: center;
    }

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
      width: 140px;
    }

    .voucher-count-1 {
      > :nth-child(1) {
        bottom: 25px;
        left: 770px;
      }
    }

    .voucher-count-2 {
      > :nth-child(1) {
        bottom: 25px;
        left: 677px;
      }

      > :nth-child(2) {
        bottom: 25px;
        left: 866px;
      }
    }

    .voucher-count-3 {
      > * {
        width: 110px;
      }

      > :nth-child(1) {
        bottom: 273px;
        left: 1399px;
        rotate: -2deg;
      }

      > :nth-child(2) {
        bottom: 273px;
        left: 1510px;
      }

      > :nth-child(3) {
        bottom: 274px;
        left: 1613px;
        rotate: 3deg;
      }
    }
  `
})
export class ShopVoucherNumbersComponent {
  readonly vouchers = input<Area | null>(null);

  protected readonly count = computed(() => this.vouchers()?.count ?? 0);
  protected readonly numbers = computed<number[]>(() => Array.from({length: this.count()}).map((_, i) => i + 1));
}

