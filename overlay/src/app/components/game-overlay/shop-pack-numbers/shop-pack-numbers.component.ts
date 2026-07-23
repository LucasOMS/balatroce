import {Component, computed, input} from "@angular/core";
import {Area} from "@shared/game-state";

@Component({
  selector: "app-shop-pack-numbers",
  host: {class: "block"},
  template: `
    @if (count() <= 2) {
      <div class="pack-count-{{ count() }}">
        @for (num of numbers(); track num) {
          <div class="pack-number text-outline-2">
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
    .pack-number {
      font-size: 60px;
      color: white;
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
      width: 170px;
    }

    .pack-count-1 {
      > :nth-child(1) {
        bottom: 14px;
        left: 1194px;
      }
    }

    .pack-count-2 {
      > :nth-child(1) {
        bottom: 13px;
        left: 1098px;
        rotate: -1deg;
      }

      > :nth-child(2) {
        bottom: 13px;
        left: 1292px;
        rotate: 0deg;
      }
    }
  `
})
export class ShopPackNumbersComponent {
  readonly packs = input.required<Area>();

  protected readonly count = computed(() => this.packs().count ?? 0);
  protected readonly numbers = computed<number[]>(() => Array.from({length: this.count()}).map((_, i) => i + 1));
}

