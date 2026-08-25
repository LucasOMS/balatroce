import {Component, computed, input} from "@angular/core";
import {Area} from "@shared/game-state";

@Component({
  selector: "app-consumable-numbers",
  host: {class: "block"},
  template: `
    @if (count() <= 4 && count() > 0) {
      <div class="consumable-count-{{ count() }}">
        @for (num of numbers(); track num) {
          <div class="consumable-number text-outline-2 text-consumable-card-number">
            <span>{{ num }}</span>
          </div>
        }
      </div>
    }
  `,

  styles: `
    .consumable-number {
      font-size: 60px;
      position: absolute;
      height: 70px;
      display: grid;
      place-content: center;
    }

    :host > * {
      & > * {
        width: 147px;
      }

      & > :last-child {
        width: 147px !important;
      }
    }

    .consumable-count-1 {
      > :nth-child(1) {
        top: 275px;
        left: 1505px;
      }
    }

    .consumable-count-2 {
      > :nth-child(1) {
        top: 273px;
        left: 1398px;
        rotate: -2deg;
      }

      > :nth-child(2) {
        top: 273px;
        left: 1612px;
        rotate: 2deg;
      }
    }

    .consumable-count-3 {
      > * {
        width: 110px;
      }

      > :nth-child(1) {
        top: 273px;
        left: 1399px;
        rotate: -2deg;
      }

      > :nth-child(2) {
        top: 273px;
        left: 1510px;
      }

      > :nth-child(3) {
        top: 274px;
        left: 1613px;
        rotate: 3deg;
      }
    }

    .consumable-count-4 {
      > * {
        width: 75px;
      }

      > :nth-child(1) {
        top: 275px;
        left: 1400px;
        rotate: -3deg;
      }

      > :nth-child(2) {
        top: 274px;
        left: 1471px;
        rotate: -1deg;
      }

      > :nth-child(3) {
        top: 274px;
        left: 1544px;
        rotate: 1deg;
      }

      > :nth-child(4) {
        top: 273px;
        left: 1611px;
        rotate: 2deg;
      }
    }
  `
})
export class ConsumableNumbersComponent {
  readonly consumables = input<Area | null>(null);

  protected readonly count = computed(() => this.consumables()?.count ?? 0);
  protected readonly limit = computed(() => this.consumables()?.limit ?? 0);

  protected readonly numbers = computed<number[]>(() => Array.from({length: this.count()}).map((_, i) => i + 1));
}

