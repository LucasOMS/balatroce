import {Component, computed, input} from "@angular/core";
import {Card} from "@shared/game-state";

@Component({
  selector: "app-shop-card-descriptions",
  host: {class: "block"},
  template: `
    @if (count() <= 2 && count() > 0) {
      <div class="card-count-{{ count() }}">
        @for (desc of descriptions(); track desc) {
          @if (desc.length > 0) {
            <div class="absolute w-21 h-35 text-white p-1 bg-black/80 flex items-center justify-center rounded-[16px] border-4 border-white text-center text-[24px]">
              <span>{{ desc }}</span>
            </div>
          }
        }
      </div>
    }
  `,

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

    :host > * > * {
      width: 160px;
    }

    .card-count-1 {
      > :nth-child(1) {
        bottom: 415px;
        left: 930px;
      }
    }

    .card-count-2 {
      > :nth-child(1) {
        bottom: 415px;
        left: 838px;
      }

      > :nth-child(2) {
        bottom: 415px;
        left: 1347px;
      }
    }
  `
})
export class ShopCardDescriptionsComponent {
  readonly shopCards = input<Card[]>([]);

  protected readonly count = computed(() => this.shopCards()?.length ?? 0);

  protected readonly descriptions = computed<string[]>(() => {
    const cards = this.shopCards();
    if (!cards) {
      return [];
    }
    return cards.map(card => card.value.effect ?? '');
  });
}

