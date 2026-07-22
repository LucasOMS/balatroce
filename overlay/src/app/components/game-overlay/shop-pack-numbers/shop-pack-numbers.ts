import { Component, input, computed } from "@angular/core";
import { Area } from "@shared/game-state";

@Component({
  selector: "app-shop-pack-numbers",
  host: { class: "block" },
  template: `<!-- nb boosters boutique : {{ count() }} -->`,
})
export class ShopPackNumbers {
  readonly packs = input<Area | null>(null);

  protected readonly count = computed(() => this.packs()?.count ?? 0);
}

