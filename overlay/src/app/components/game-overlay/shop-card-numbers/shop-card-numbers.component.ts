import {Component, computed, input} from "@angular/core";
import {Area} from "@shared/game-state";

@Component({
  selector: "app-shop-card-numbers",
  host: {class: "block"},
  template: `
    @if (count() <= 2) {
      <div class="card-count-{{ count() }}">
        @for (num of numbers(); track num) {
          <div class="card-number text-outline-2 text-buyable-number">
            <span>{{ num }}</span>
          </div>
        }
      </div>
    } @else {
      <div class="error-message text-outline-2">
        Vous avez cassé le jeu au delà de nos attentes.<br>Vous allez devoir compter les cartes
      </div>
    }
  `,

  styles: `
    .card-number {
      font-size: 60px;
      position: absolute;
      height: 50px;
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
      width: 149px;
    }

    .card-count-1 {
      > :nth-child(1) {
        bottom: 397px;
        left: 1098px;
      }
    }

    .card-count-2 {
      > :nth-child(1) {
        bottom: 398px;
        left: 1008px;
      }

      > :nth-child(2) {
        bottom: 398px;
        left: 1187px;
      }
    }
  `
})
export class ShopCardNumbersComponent {
  readonly shop = input<Area | null>(null);

  protected readonly count = computed(() => this.shop()?.count ?? 0);
  protected readonly numbers = computed<number[]>(() => Array.from({length: this.count()}).map((_, i) => i + 1));
}

