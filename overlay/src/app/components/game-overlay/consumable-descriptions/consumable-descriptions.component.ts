import {Component, computed, inject, input} from "@angular/core";
import {Area} from "@shared/game-state";
import {AutoFitTextComponent} from '../../auto-fit-text/auto-fit-text.component';
import {CardComponent} from '../../card.component';
import {getCardDescription} from '../../../const/card-descriptions';
import {OverlaySocket} from '../../../services/overlay-socket';

@Component({
  selector: "app-consumable-descriptions",
  host: {class: "block"},
  imports: [
    AutoFitTextComponent,
    CardComponent
  ],
  template: `
    @if (count() > 0) {
      <div class="consumable-descriptions">
        @for (desc of descriptions(); track desc) {
          @if (desc.length > 0) {
            <app-card class="consumable-description flex items-center justify-center rounded-[16px] text-center">
              <app-auto-fit-text baseFontSize="24" class="**:items-center">
                <span [innerHTML]="desc"></span>
              </app-auto-fit-text>
            </app-card>
          }
        }
      </div>
    }
  `,
  styles: `
    .consumable-descriptions {
      position: fixed;
      position-anchor: --game;
      top: calc(anchor(top) - 110px);
      left: calc(anchor(left) + 1379px);
      width: 390px;
      height: var(--joker-consumable-height);
      display: flex;

      display: flex;
      justify-content: center;

      &:has(> :nth-child(2):last-child) {
        gap: 80px;
      }

      &:has(> :nth-child(3)) {
        justify-content: space-between;
      }
    }


    .consumable-description {
      --consumable-width: 145px;
      width: var(--consumable-width);
      max-width: var(--consumable-width);
      /* Allow the flex item to actually shrink below its content's
         min-content size instead of overflowing the row when more
         consumables are added. */
      min-width: 0;
      overflow: hidden;

      &:last-child {
        min-width: var(--consumable-width) !important;
      }
    }
  `
})
export class ConsumableDescriptionsComponent {
  private readonly overlaySocket = inject(OverlaySocket);

  readonly consumables = input.required<Area>();

  protected readonly count = computed(() => this.consumables().count ?? 0);

  protected readonly descriptions = computed<string[]>(() =>
    this.consumables().cards.map(card => getCardDescription(card, this.overlaySocket.overlayInfo()?.gameState?.hands))
  );
}

