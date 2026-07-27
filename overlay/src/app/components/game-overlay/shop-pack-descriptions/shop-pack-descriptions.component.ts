import {Component, computed, input} from "@angular/core";
import {Area} from "@shared/game-state";
import {CardComponent} from '../../card.component';

@Component({
  selector: "app-shop-pack-descriptions",
  host: {class: "block"},
  template: `
    @if (count() <= 2) {
      <div class="pack-count-{{ count() }}">
        @for (desc of descriptions(); track desc) {
          @if (desc.length > 0) {
            <app-card class="absolute w-21 h-35 flex items-center justify-center text-center text-[24px]">
              <span>{{ desc }}</span>
            </app-card>
          }
        }
      </div>
    }
  `,
  imports: [
    CardComponent
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

    .pack-count-1 {
      > * {
        width: 150px;
      }

      > :nth-child(1) {
        bottom: 55px;
        left: 1040px;
      }
    }

    .pack-count-2 {
      > * {
        width: 160px;
      }

      > :nth-child(1) {
        bottom: 61px;
        left: 1098px;
      }

      > :nth-child(2) {
        bottom: 61px;
        left: 1299px;
      }
    }
  `
})
export class ShopPackDescriptionsComponent {
  readonly packs = input.required<Area>();

  protected readonly count = computed(() => this.packs().count ?? 0);

  protected readonly descriptions = computed<string[]>(() => {
    return this.packs().cards.map(pack => pack.value.effect ?? '')
  });
}

