import { Component, input, computed } from "@angular/core";
import { Area } from "@shared/game-state";

@Component({
  selector: "app-shop-voucher-numbers",
  host: { class: "block" },
  template: `<!-- nb coupons boutique : {{ count() }} -->`,
})
export class ShopVoucherNumbers {
  readonly vouchers = input<Area | null>(null);

  protected readonly count = computed(() => this.vouchers()?.count ?? 0);
}

