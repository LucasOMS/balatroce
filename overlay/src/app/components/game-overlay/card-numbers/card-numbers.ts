import { Component, input, computed } from "@angular/core";
import { Area } from "@shared/game-state";

@Component({
  selector: "app-card-numbers",
  host: { class: "block" },
  template: `<!-- cartes en main : {{ count() }}/{{ limit() }} -->`,
})
export class CardNumbers {
  readonly hand = input<Area | null>(null);

  protected readonly count = computed(() => this.hand()?.count ?? 0);
  protected readonly limit = computed(() => this.hand()?.limit ?? 0);
}

