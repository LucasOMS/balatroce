import {Component, computed, effect, input} from "@angular/core";
import {Area, CardSet} from "@shared/game-state";
import {CardComponent} from '../../card.component';
import {AutoFitTextComponent} from '../../auto-fit-text/auto-fit-text.component';
import {getCardDescription} from '../../../const/card-descriptions';

@Component({
  selector: "app-pack-opening",
  host: {class: "block"},
  imports: [
    CardComponent,
    AutoFitTextComponent,
  ],
  template: `
    @if (baseCardCount() > 0) {

      @if (shouldSelectExtraCards()) {
        @let currentExtraCardNumbers = extraCardNumbers();
        <div
          class="extra-card-numbers"
          [style.--center]="currentExtraCardNumbers.length % 2 === 0 ? (currentExtraCardNumbers.length + 1) : currentExtraCardNumbers.length">
          @for (extraCardNumber of currentExtraCardNumbers; track extraCardNumber) {
            <div class="card-number text-play-card-number">
              <app-card class="p-1!">{{ extraCardNumber }}</app-card>
            </div>
          }
        </div>
      }

      <div class="base-card-descriptions">
        @for (desc of baseCardDescriptions(); track desc) {
          @if (desc.length > 0) {
            <div class="relative flex flex-col gap-2">
              <div class="card-number text-center text-outline-2 absolute left-1/2 -top-8 -translate-x-1/2 text-pack-consumable-number">
                {{ $index + 1 }}
              </div>

              <app-card class="base-card-description h-full flex items-center justify-center rounded-[16px] text-center">
                <app-auto-fit-text baseFontSize="24" class="**:items-center">
                  <div [innerHTML]="desc"></div>
                </app-auto-fit-text>
              </app-card>
            </div>
          }
        }
      </div>
    }
  `,
  styles: `
    .card-number {
      font-size: 60px;
      height: 50px;
      display: grid;
      place-content: center;
      line-height: 1;
    }

    .extra-card-numbers {
      display: flex;
      position: absolute;
      left: 520px;
      top: 450px;
      width: 1050px;

      .card-number {
        flex: 1;

        --center: calc((sibling-count()) / 2 + 0.5);
        --offset: calc(sibling-index() - var(--center));
        --normalized: calc(var(--offset) / var(--center));

        /* ±20deg selon la distance au centre */
        transform: translateY(abs(calc(var(--normalized) * 50px))) rotate(calc(var(--normalized) * 15deg));
      }

      > :last-child {
        min-width: 161px;
      }
    }

    .base-card-descriptions {
      position: absolute;
      top: 660px;
      left: 85px;
      width: 843px;
      height: 215px;

      margin-inline: 50%;
      translate: -50% 0;

      display: flex;
      justify-content: center;

      &:has(> :nth-child(2):last-child) {
        gap: 58px;
      }

      &:has(> :nth-child(3)) {
        gap: 38px;
      }
    }


    .base-card-description {
      --base-card-width: 161px;
      width: var(--base-card-width);
      max-width: var(--base-card-width);
      /* Allow the flex item to actually shrink below its content's
         min-content size instead of overflowing the row when more
         base-cards are added. */
      min-width: 0;
      overflow: hidden;

      &:last-child {
        min-width: var(--base-card-width) !important;
      }
    }
  `
})
export class PackOpeningComponent {
  readonly pack = input.required<Area>();
  public readonly handSize = input.required<number>()

  public readonly shouldSelectExtraCards = computed<boolean>(() => this.pack().cards.map(c => c.set).some(
    s => [
      // Card that could require selecting extra card
      CardSet.TAROT,
      CardSet.SPECTRAL,
    ].includes(s)
  ));

  public readonly baseCardCount = computed(() => this.pack().count)

  protected readonly baseCardDescriptions = computed<string[]>(() => this.pack().cards.map(c => getCardDescription(c)));

  protected readonly extraCardNumbers = computed<number[]>(() => Array.from({length: this.handSize()}).map((_, i) => i + 1));

  constructor() {
    effect(() => {
      console.log(this.pack());
      console.log(this.handSize());
    });
  }
}

