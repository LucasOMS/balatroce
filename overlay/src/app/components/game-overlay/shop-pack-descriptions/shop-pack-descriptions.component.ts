import {Component, computed, input} from "@angular/core";
import {Area} from "@shared/game-state";

@Component({
  selector: "app-shop-pack-descriptions",
  host: {class: "block"},
  template: `
    @if (count() <= 2) {
      <div class="voucher-count-{{ count() }}">
        @for (desc of descriptions(); track desc) {
          @if (desc.length > 0) {
            <div class="absolute w-21 h-35 text-white p-1 flex items-center justify-center rounded-[16px] border-4 border-white text-center text-[24px]">
              <span>{{ desc }}</span>
            </div>
          }
        }
      </div>
    }
  `,

  styles: `
    .voucher-number {
      font-size: 60px;
      color: white;
      position: absolute;
      height: 70px;
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

    .voucher-count-1 {
      > * {
        width: 150px;
        background: rgba(0, 0, 0, .8);
      }

      > :nth-child(1) {
        bottom: 55px;
        left: 1040px;
      }
    }

    .voucher-count-2 {
      > * {
        width: 160px;
        background: rgba(0, 0, 0, .9);
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

