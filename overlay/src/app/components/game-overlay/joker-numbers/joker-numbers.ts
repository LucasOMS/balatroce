import { Component, input, computed } from "@angular/core";
import { Area } from "@shared/game-state";

@Component({
  selector: "app-joker-numbers",
  host: { class: "block" },
  template: `<!-- count/limit jokers : {{ count() }}/{{ limit() }} -->`,
})
export class JokerNumbers {
  readonly jokers = input<Area | null>(null);

  protected readonly count = computed(() => this.jokers()?.count ?? 0);
  protected readonly limit = computed(() => this.jokers()?.limit ?? 0);
}

