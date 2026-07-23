import {Component, computed, input} from "@angular/core";
import {Area} from "@shared/game-state";
import {AutoFitTextComponent} from '../../auto-fit-text/auto-fit-text.component';

@Component({
  selector: "app-consumable-descriptions",
  host: {class: "block"},
  template: `
    @if (count() <= 4 && count() > 0) {
      <div class="card-count-{{ count() }}">
        @for (desc of descriptions(); track desc) {
          @if (desc.length > 0) {
            <div class="absolute text-white p-1 bg-black/80 flex items-center justify-center rounded-[16px] border-4 border-white text-center">
              <app-auto-fit-text baseFontSize="24" class="**:items-center">
                {{ desc }}
              </app-auto-fit-text>
            </div>
          }
        }
      </div>
    }
  `,
  imports: [
    AutoFitTextComponent
  ],

  styles: `
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

    .card-count-1 {
      > :nth-child(1) {
        width: 150px;
        top: 31px;
        left: 1671px;
      }
    }

    .card-count-2 {
      > * {
        width: 148px;
        height: 216px;
      }

      > :nth-child(1) {
        top: 59px;
        left: 1391px;
        rotate: -2deg;
      }

      > :nth-child(2) {
        top: 56px;
        left: 1620px;
        rotate: 1deg;
      }
    }

    .card-count-4 {
      > * {
        width: 79px;
        height: 216px;
      }

      > :nth-child(1) {
        top: 59px;
        left: 1391px;
        rotate: -2deg;
      }

      > :nth-child(2) {
        top: 56px;
        left: 1465px;
        rotate: 1deg;
      }

      > :nth-child(3) {
        top: 56px;
        left: 1541px;
        rotate: 1deg;
      }

      > :nth-child(4) {
        width: 148px;
        top: 56px;
        left: 1620px;
        rotate: 1deg;
      }
    }
  `
})
export class ConsumableDescriptionsComponent {
  readonly consumables = input.required<Area>();

  protected readonly count = computed(() => this.consumables().count ?? 0);

  protected readonly descriptions = computed<string[]>(() =>
    this.consumables().cards.map(card => card.value.effect ?? '')
  );
}

