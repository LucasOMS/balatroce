import { Component, input, computed } from "@angular/core";
import { Area } from "@shared/game-state";

@Component({
  selector: "app-remaining-cards",
  host: { class: "block" },
  template: `<!-- cartes restantes dans le deck : {{ remaining() }} -->`,
})
export class RemainingCards {
  readonly deck = input<Area | null>(null);
  readonly hand = input<Area | null>(null);

  protected readonly remaining = computed(() => {
    const d = this.deck();
    const h = this.hand();
    if (!d || !h) return 0;
    return d.count - h.count;
  });
}

