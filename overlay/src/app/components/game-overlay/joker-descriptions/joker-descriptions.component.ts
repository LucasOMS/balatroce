import {Component, computed, input} from "@angular/core";
import {Area} from "@shared/game-state";
import {AutoFitTextComponent} from '../../auto-fit-text/auto-fit-text.component';
import {CardComponent} from '../../card.component';
import {JOKER_DESCRIPTIONS} from '../../../const/card-descriptions';

@Component({
  selector: "app-joker-descriptions",
  host: {class: "block"},
  imports: [
    AutoFitTextComponent,
    CardComponent
  ],
  template: `
    @if (count() > 0) {
      <div class="joker-descriptions">
        @for (desc of descriptions(); track desc) {
          @if (desc.length > 0) {
            <app-card class="joker-description flex items-center justify-center rounded-[16px] text-center">
              <app-auto-fit-text baseFontSize="24" class="**:items-center">
                <div [innerHTML]="desc"></div>
              </app-auto-fit-text>
            </app-card>
          }
        }
      </div>
    }
  `,
  styles: `
    .joker-descriptions {
      position: fixed;
      position-anchor: --game;
      top: calc(anchor(top) - 130px);
      left: calc(anchor(left) + 519px);
      width: 843px;
      height: var(--joker-card-height);

      display: flex;
      justify-content: center;

      &:has(> :nth-child(2):last-child) {
        gap: 180px;
      }

      &:has(> :nth-child(3)) {
        justify-content: space-between;
      }
    }


    .joker-description {
      --joker-width: 161px;
      width: var(--joker-width);
      max-width: var(--joker-width);
      /* Allow the flex item to actually shrink below its content's
         min-content size instead of overflowing the row when more
         jokers are added. */
      min-width: 0;
      overflow: hidden;

      &:last-child {
        min-width: var(--joker-width) !important;
      }
    }
  `
})
export class JokerDescriptionsComponent {
  readonly jokers = input.required<Area>();

  protected readonly count = computed(() => this.jokers().cards.length ?? 0);

  protected readonly descriptions = computed<string[]>(() =>
    this.jokers().cards.map(joker => JOKER_DESCRIPTIONS[joker.key] ?? joker.value.effect ?? '')
  );
}

