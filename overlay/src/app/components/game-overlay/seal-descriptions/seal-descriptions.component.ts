import {Component, computed, input} from '@angular/core';
import {Area, CardSeal} from '@shared/game-state';
import {CardComponent} from '../../card.component';

@Component({
  selector: 'app-seal-descriptions',
  imports: [
    CardComponent
  ],
  host: {class: "block"},
  template: `

    @if (seals().length > 0) {

      <app-card
        title="Effet des sceaux"
        class="absolute top-[342px] right-1.5 max-w-[435px]">
        <div class="grid grid-cols-[auto_1fr] gap-1 text-[26px]">
          @for (seal of seals(); track seal) {
            <div class="seal-image seal-{{seal.toLowerCase()}}"></div>

            <div [innerHTML]="descriptions[seal]"></div>
          }
        </div>
      </app-card>
    }


  `,
  styles: `
    .seal-image {
      width: 36px;
      height: 36px;
      background-position: center center;
      background-repeat: no-repeat;
      background-size: contain;
    }

    .seal-gold {
      background-image: url("/seals/gold-seal.png");
    }

    .seal-red {
      background-image: url("/seals/red-seal.png");
    }

    .seal-blue {
      background-image: url("/seals/blue-seal.png");
    }

    .seal-purple {
      background-image: url("/seals/purple-seal.png");
    }
  `
})
export class SealDescriptionsComponent {
  public readonly hand = input<Area>()

  public readonly cards = computed(() => this.hand()?.cards ?? []);

  protected readonly descriptions: Record<CardSeal, string> = {
    [CardSeal.GOLD]: "Gagne <span class='text-money'>3$</span> si marque",
    [CardSeal.RED]: "Réactive cette carte 1 fois.",
    [CardSeal.BLUE]: "Crée une carte planète pour la dernière main jouée pendant la manche si tenue à la fin.",
    [CardSeal.PURPLE]: "Crée une carte de tarot quand défaussée",
  };

  protected readonly seals = computed<CardSeal[]>(() => {
    const seals = this.cards().map(c => c.modifier.seal);
    return [
      CardSeal.GOLD,
      CardSeal.RED,
      CardSeal.BLUE,
      CardSeal.PURPLE,
    ].filter(seal => seals.includes(seal));
  });
}
