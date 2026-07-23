import { Component, input } from "@angular/core";
import { Card } from "@shared/game-state";

@Component({
  selector: "app-shop-card-descriptions",
  host: { class: "block" },
  template: `<!-- descriptions des cartes boutique : {{ shopCards().length }} cartes -->`,
})
export class ShopCardDescriptionsComponent {
  readonly shopCards = input<Card[]>([]);
}

