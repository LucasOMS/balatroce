import {Component, computed, input} from "@angular/core";
import {Area} from "@shared/game-state";
import {CardModifierDescriptions} from './card-modifier-descriptions';

@Component({
  selector: "app-card-numbers",
  host: {class: "block"},
  template: `

    @if (count() <= 12) {
      @let cards = hand()?.cards ?? [];

      <div class="card-count-{{ count() }}">
        @for (num of numbers(); track num) {
          @let card = cards[num - 1];

          <div class="card-info">
            <app-card-modifier-descriptions [card]="card" />

            <div class="card-number text-outline-2 text-play-card-number">
              <span>{{ num }}</span>
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="error-message">
        Vous avez cassé le jeu au delà de nos attente.<br>Vous allez devoir compter les cartes
      </div>
    }
  `,
  imports: [
    CardModifierDescriptions
  ],

  styles: `
    .card-number {
      font-size: 60px;
      height: 70px;
      display: grid;
      place-content: center;
    }

    .card-info {
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      width: 161px;

      &:last-child {
        width: 161px !important;
      }
    }

    .card-count-1 {
      > :nth-child(1) {
        bottom: 452px;
        left: 532px;
      }
    }

    .card-count-2 {
      > :nth-child(1) {
        bottom: 443px;
        left: 526px;
        rotate: -3deg;
      }

      > :nth-child(2) {
        bottom: 442px;
        left: 1404px;
        rotate: 3deg;
      }
    }

    .card-count-3 {
      > :nth-child(1) {
        bottom: 443px;
        left: 526px;
        rotate: -3deg;
      }

      > :nth-child(2) {
        bottom: 453px;
        left: 965px;
      }

      > :nth-child(3) {
        bottom: 442px;
        left: 1404px;
        rotate: 3deg;
      }
    }

    .card-count-4 {
      > :nth-child(1) {
        bottom: 443px;
        left: 526px;
        rotate: -3deg;
      }

      > :nth-child(2) {
        bottom: 451px;
        left: 817px;
        rotate: -1deg;
      }

      > :nth-child(3) {
        bottom: 450px;
        left: 1112px;
        rotate: 2deg;
      }

      > :nth-child(4) {
        bottom: 439px;
        left: 1408px;
        rotate: 5deg;
      }
    }

    .card-count-5 {
      > :nth-child(1) {
        bottom: 437px;
        left: 521px;
        rotate: -5deg;
      }

      > :nth-child(2) {
        bottom: 445px;
        left: 743px;
        rotate: -2deg;
      }

      > :nth-child(3) {
        bottom: 453px;
        left: 966px;
        rotate: 0deg;
      }

      > :nth-child(4) {
        bottom: 446px;
        left: 1188px;
        rotate: 3deg;
      }

      > :nth-child(5) {
        bottom: 439px;
        left: 1408px;
        rotate: 5deg;
      }
    }

    .card-count-6 {
      > :nth-child(1) {
        bottom: 437px;
        left: 521px;
        rotate: -5deg;
      }

      > :nth-child(2) {
        bottom: 445px;
        left: 698px;
        rotate: -3deg;
      }

      > :nth-child(3) {
        bottom: 451px;
        left: 876px;
        rotate: -1deg;
      }

      > :nth-child(4) {
        bottom: 450px;
        left: 1053px;
        rotate: 1deg;
      }

      > :nth-child(5) {
        bottom: 444px;
        left: 1229px;
        rotate: 3deg;
      }

      > :nth-child(6) {
        bottom: 435px;
        left: 1408px;
        rotate: 5deg;
      }
    }

    .card-count-7 {
      > * {
        width: 146px;
      }

      > :nth-child(1) {
        bottom: 437px;
        left: 521px;
        rotate: -5deg;
      }

      > :nth-child(2) {
        bottom: 443px;
        left: 670px;
        rotate: -4deg;
      }

      > :nth-child(3) {
        bottom: 448px;
        left: 819px;
        rotate: -2deg;
      }

      > :nth-child(4) {
        bottom: 453px;
        left: 968px;
        rotate: 0deg;
      }

      > :nth-child(5) {
        bottom: 446px;
        left: 1116px;
        rotate: 2deg;
      }

      > :nth-child(6) {
        bottom: 441px;
        left: 1263px;
        rotate: 4deg;
      }

      > :nth-child(7) {
        bottom: 435px;
        left: 1408px;
        rotate: 5deg;
      }
    }

    .card-count-8 {
      > * {
        width: 125px;
      }

      > :nth-child(1) {
        bottom: 433px;
        left: 521px;
        rotate: -5deg;
      }

      > :nth-child(2) {
        bottom: 439px;
        left: 650px;
        rotate: -4deg;
      }

      > :nth-child(3) {
        bottom: 444px;
        left: 778px;
        rotate: -2deg;
      }

      > :nth-child(4) {
        bottom: 449px;
        left: 905px;
        rotate: 0deg;
      }

      > :nth-child(5) {
        bottom: 449px;
        left: 1031px;
        rotate: 1deg;
      }

      > :nth-child(6) {
        bottom: 445px;
        left: 1158px;
        rotate: 2deg;
      }

      > :nth-child(7) {
        bottom: 439px;
        left: 1284px;
        rotate: 3.3deg;
      }

      > :nth-child(8) {
        bottom: 433px;
        left: 1408px;
        rotate: 5deg;
      }
    }

    .card-count-9 {
      > * {
        width: 111px;
      }

      > :nth-child(1) {
        bottom: 433px;
        left: 521px;
        rotate: -5deg;
      }

      > :nth-child(2) {
        bottom: 437px;
        left: 634px;
        rotate: -4deg;
      }

      > :nth-child(3) {
        bottom: 442px;
        left: 747px;
        rotate: -2deg;
      }

      > :nth-child(4) {
        bottom: 447px;
        left: 857px;
        rotate: -2deg;
      }

      > :nth-child(5) {
        bottom: 452px;
        left: 968px;
        rotate: 0deg;
      }

      > :nth-child(6) {
        bottom: 448px;
        left: 1078px;
        rotate: 1deg;
      }

      > :nth-child(7) {
        bottom: 444px;
        left: 1188px;
        rotate: 3.3deg;
      }

      > :nth-child(8) {
        bottom: 439px;
        left: 1298px;
        rotate: 4deg;
      }

      > :nth-child(9) {
        bottom: 433px;
        left: 1408px;
        rotate: 5deg;
      }
    }

    .card-count-10 {
      > * {
        width: 98px;
      }

      > :nth-child(1) {
        bottom: 430px;
        left: 521px;
        rotate: -5deg;
      }

      > :nth-child(2) {
        bottom: 435px;
        left: 620px;
        rotate: -4deg;
      }

      > :nth-child(3) {
        bottom: 440px;
        left: 720px;
        rotate: -3deg;
      }

      > :nth-child(4) {
        bottom: 445px;
        left: 817px;
        rotate: -2deg;
      }

      > :nth-child(5) {
        bottom: 449px;
        left: 917px;
        rotate: 0deg;
      }

      > :nth-child(6) {
        bottom: 450px;
        left: 1016px;
        rotate: 1deg;
      }

      > :nth-child(7) {
        bottom: 447px;
        left: 1115px;
        rotate: 1.7deg;
      }

      > :nth-child(8) {
        bottom: 443px;
        left: 1214px;
        rotate: 2.9deg;
      }

      > :nth-child(9) {
        bottom: 439px;
        left: 1312px;
        rotate: 4deg;
      }

      > :nth-child(10) {
        bottom: 433px;
        left: 1410px;
        rotate: 5deg;
      }
    }

    .card-count-11 {
      > * {
        width: 87px;
      }

      > :nth-child(1) {
        bottom: 430px;
        left: 521px;
        rotate: -5deg;
      }

      > :nth-child(2) {
        bottom: 434px;
        left: 610px;
        rotate: -4deg;
      }

      > :nth-child(3) {
        bottom: 439px;
        left: 700px;
        rotate: -3deg;
      }

      > :nth-child(4) {
        bottom: 443px;
        left: 788px;
        rotate: -2deg;
      }

      > :nth-child(5) {
        bottom: 447px;
        left: 877px;
        rotate: -1deg;
      }

      > :nth-child(6) {
        bottom: 451px;
        left: 965px;
        rotate: -1deg;
      }

      > :nth-child(7) {
        bottom: 447px;
        left: 1055px;
        rotate: 1.7deg;
      }

      > :nth-child(8) {
        bottom: 445px;
        left: 1144px;
        rotate: 2.2deg;
      }

      > :nth-child(9) {
        bottom: 442px;
        left: 1232px;
        rotate: 3deg;
      }

      > :nth-child(10) {
        bottom: 438px;
        left: 1321px;
        rotate: 4deg;
      }

      > :nth-child(11) {
        bottom: 433px;
        left: 1410px;
        rotate: 5deg;
      }
    }

    .card-count-12 {
      > * {
        width: 80px;
      }

      > :nth-child(1) {
        bottom: 430px;
        left: 521px;
        rotate: -5deg;
      }

      > :nth-child(2) {
        bottom: 434px;
        left: 603px;
        rotate: -4deg;
      }

      > :nth-child(3) {
        bottom: 438px;
        left: 685px;
        rotate: -3deg;
      }

      > :nth-child(4) {
        bottom: 442px;
        left: 767px;
        rotate: -2deg;
      }

      > :nth-child(5) {
        bottom: 446px;
        left: 847px;
        rotate: -2deg;
      }

      > :nth-child(6) {
        bottom: 449px;
        left: 927px;
        rotate: -1deg;
      }

      > :nth-child(7) {
        bottom: 450px;
        left: 1009px;
        rotate: -0.3deg;
      }

      > :nth-child(8) {
        bottom: 447px;
        left: 1090px;
        rotate: 2deg;
      }

      > :nth-child(9) {
        bottom: 444px;
        left: 1171px;
        rotate: 3deg;
      }

      > :nth-child(10) {
        bottom: 441px;
        left: 1251px;
        rotate: 3deg;
      }

      > :nth-child(11) {
        bottom: 438px;
        left: 1330px;
        rotate: 4deg;
      }

      > :nth-child(12) {
        bottom: 433px;
        left: 1410px;
        rotate: 5deg;
      }
    }

  `
})
export class CardNumbersComponent {
  readonly hand = input<Area | null>(null);

  protected readonly count = computed(() => this.hand()?.count ?? 0);
  protected readonly limit = computed(() => this.hand()?.limit ?? 0);

  protected readonly numbers = computed<number[]>(() => Array.from({length: this.count()}).map((_, i) => i + 1));
}

