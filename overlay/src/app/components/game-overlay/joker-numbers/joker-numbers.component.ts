import {Component, computed, input} from "@angular/core";
import {Area} from "@shared/game-state";

@Component({
  selector: "app-joker-numbers",
  host: {class: "block"},
  template: `

    @if (count() <= 9) {
      <div class="joker-count-{{ count() }}">
        @for (num of numbers(); track num) {
          <div class="joker-number text-outline-2 text-joker-number">
            <span>{{ num }}</span>
          </div>
        }
      </div>
    } @else {
      <div class="error-message text-outline-2">
        Vous avez cassé le jeu au delà de nos attentes.<br>Vous allez devoir compter les jokers
      </div>
    }
  `,

  styles: `
    .joker-number {
      font-size: 60px;
      position: absolute;
      height: 70px;
      display: grid;
      place-content: center;
    }

    .error-message {
      position: absolute;
      top: 280px;
      left: 598px;
      color: white;
      font-size: 26px;
      text-align: center;
      line-height: 28px;
      width: 672px;
    }

    :host > * {
      & > * {
        width: 161px;
      }

      & > :last-child {
        width: 161px !important;
      }
    }

    .joker-count-1 {
      > :nth-child(1) {
        top: 275px;
        left: 861px;
      }
    }

    .joker-count-2 {
      > :nth-child(1) {
        top: 275px;
        left: 695px;
        rotate: -2deg;
      }

      > :nth-child(2) {
        top: 275px;
        left: 1024px;
        rotate: 2deg;
      }
    }

    .joker-count-3 {
      > :nth-child(1) {
        top: 273px;
        left: 530px;
        rotate: -3deg;
      }

      > :nth-child(2) {
        top: 275px;
        left: 861px;
      }

      > :nth-child(3) {
        top: 274px;
        left: 1190px;
        rotate: 3deg;
      }
    }

    .joker-count-4 {
      > :nth-child(1) {
        top: 275px;
        left: 531px;
        rotate: -3deg;
      }

      > :nth-child(2) {
        top: 274px;
        left: 750px;
        rotate: -1deg;
      }

      > :nth-child(3) {
        top: 274px;
        left: 970px;
        rotate: 1deg;
      }

      > :nth-child(4) {
        top: 273px;
        left: 1191px;
        rotate: 2deg;
      }
    }

    .joker-count-5 {
      > :nth-child(1) {
        top: 273px;
        left: 531px;
        rotate: -3deg;
      }

      > :nth-child(2) {
        top: 272px;
        left: 696px;
        rotate: -2deg;
      }

      > :nth-child(3) {
        top: 274px;
        left: 861px;
        rotate: 0deg;
      }

      > :nth-child(4) {
        top: 274px;
        left: 1025px;
        rotate: 1deg;
      }

      > :nth-child(5) {
        top: 273px;
        left: 1188px;
        rotate: 2deg;
      }
    }

    .joker-count-6 {
      > * {
        width: 133px;
      }

      > :nth-child(1) {
        top: 273px;
        left: 531px;
        rotate: -3deg;
      }

      > :nth-child(2) {
        top: 275px;
        left: 666px;
        rotate: -2deg;
      }

      > :nth-child(3) {
        top: 273px;
        left: 799px;
        rotate: -1deg;
      }

      > :nth-child(4) {
        top: 275px;
        left: 931px;
        rotate: 1deg;
      }

      > :nth-child(5) {
        top: 274px;
        left: 1062px;
        rotate: 2deg;
      }

      > :nth-child(6) {
        top: 274px;
        left: 1188px;
        rotate: 3deg;
      }
    }

    .joker-count-7 {
      > * {
        width: 112px;
      }

      > :nth-child(1) {
        top: 274px;
        left: 531px;
        rotate: -3deg;
      }

      > :nth-child(2) {
        top: 273px;
        left: 642px;
        rotate: -2deg;
      }

      > :nth-child(3) {
        top: 274px;
        left: 753px;
        rotate: -1deg;
      }

      > :nth-child(4) {
        top: 274px;
        left: 864px;
        rotate: 0deg;
      }

      > :nth-child(5) {
        top: 274px;
        left: 976px;
        rotate: 1deg;
      }

      > :nth-child(6) {
        top: 273px;
        left: 1087px;
        rotate: 2deg;
      }

      > :nth-child(7) {
        top: 274px;
        left: 1191px;
        rotate: 3deg;
      }
    }

    .joker-count-8 {
      > * {
        width: 95px;
      }

      > :nth-child(1) {
        top: 274px;
        left: 531px;
        rotate: -3deg;
      }

      > :nth-child(2) {
        top: 273px;
        left: 627px;
        rotate: -2deg;
      }

      > :nth-child(3) {
        top: 274px;
        left: 722px;
        rotate: -1deg;
      }

      > :nth-child(4) {
        top: 274px;
        left: 816px;
        rotate: 0deg;
      }

      > :nth-child(5) {
        top: 274px;
        left: 911px;
        rotate: 1deg;
      }

      > :nth-child(6) {
        top: 273px;
        left: 1005px;
        rotate: 1deg;
      }

      > :nth-child(7) {
        top: 273px;
        left: 1098px;
        rotate: 3deg;
      }

      > :nth-child(8) {
        top: 274px;
        left: 1192px;
        rotate: 3deg;
      }
    }

    .joker-count-9 {
      > * {
        width: 83px;
      }

      > :nth-child(1) {
        top: 274px;
        left: 531px;
        rotate: -3deg;
      }

      > :nth-child(2) {
        top: 273px;
        left: 614px;
        rotate: -2deg;
      }

      > :nth-child(3) {
        top: 274px;
        left: 698px;
        rotate: -1deg;
      }

      > :nth-child(4) {
        top: 274px;
        left: 779px;
        rotate: 0deg;
      }

      > :nth-child(5) {
        top: 274px;
        left: 862px;
        rotate: 1deg;
      }

      > :nth-child(6) {
        top: 273px;
        left: 945px;
        rotate: 1deg;
      }

      > :nth-child(7) {
        top: 272px;
        left: 1026px;
        rotate: 2deg;
      }

      > :nth-child(8) {
        top: 272px;
        left: 1109px;
        rotate: 2deg;
      }

      > :nth-child(9) {
        top: 274px;
        left: 1192px;
        rotate: 3deg;
      }
    }

  `
})
export class JokerNumbersComponent {
  readonly jokers = input<Area | null>(null);

  protected readonly count = computed(() => this.jokers()?.count ?? 0);
  protected readonly limit = computed(() => this.jokers()?.limit ?? 0);

  protected readonly numbers = computed<number[]>(() => Array.from({length: this.count()}).map((_, i) => i + 1));

}

