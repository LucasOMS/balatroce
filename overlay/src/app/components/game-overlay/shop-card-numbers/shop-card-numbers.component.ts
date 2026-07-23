import { Component, input, computed } from "@angular/core";
import { Area } from "@shared/game-state";

@Component({
  selector: "app-shop-card-numbers",
  host: { class: "block" },
  template: `<!-- nb cartes boutique : {{ count() }} -->`,
})
export class ShopCardNumbersComponent {
  readonly shop = input<Area | null>(null);

  protected readonly count = computed(() => this.shop()?.count ?? 0);
}

