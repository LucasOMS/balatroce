import {Component, computed, input} from '@angular/core';
import {Card, CardEnhancement} from '@shared/game-state';
import {CardComponent} from '../../card.component';

@Component({
  selector: 'app-card-modifier-descriptions',
  imports: [
    CardComponent
  ],
  host: {
    class: 'block'
  },
  template: `
    @if (hasEnhancement()) {
      <app-card class="flex flex-col text-[26px]/3 text-outline-1">
        @if (isBonus()) {
          <span><span class="text-chips">+30</span>&nbsp;Jetons</span>
        }
        @if (isMult()) {
          <span><span class="text-mult">+4</span>&nbsp;Multi</span>
        }
        @if (isWild()) {
          <span>Toutes les couleurs</span>
        }
        @if (isGlass()) {
          <span><span class="w-min bg-mult text-white px-[4px] py-[2px] rounded-[6px]">×2</span>&nbsp;Multi</span>
          <span><span class="text-probability">1/4</span> carte détruite</span>
        }
        @if (isSteel()) {
          <span>
            <span class="w-min bg-mult text-white px-[4px] py-[2px] rounded-[6px]">×1.5</span>&nbsp;Multi si marque
          </span>
        }
        @if (isStone()) {
          <span><span class="text-chips">+50</span>&nbsp;Jetons</span>
        }
        @if (isGold()) {
          <span><span class="text-money">+3$</span> si tenue en fin de manche</span>
        }
        @if (isLucky()) {
          <span><span class="text-probability">1/5</span>&nbsp;<span class="text-mult">+20</span>&nbsp;Multi</span>
          <span><span class="text-probability">1/15</span>&nbsp;<span class="text-money">+20$</span></span>
        }
      </app-card>
    }
  `,
})
export class CardModifierDescriptions {
  public readonly card = input.required<Card>()

  protected readonly hasEnhancement = computed<boolean>(() =>
    this.isBonus()
    || this.isMult()
    || this.isWild()
    || this.isGlass()
    || this.isSteel()
    || this.isStone()
    || this.isGold()
    || this.isLucky()
  );

  protected readonly isBonus = computed<boolean>(() => this.card().modifier.enhancement === CardEnhancement.BONUS);
  protected readonly isMult = computed<boolean>(() => this.card().modifier.enhancement === CardEnhancement.MULT);
  protected readonly isWild = computed<boolean>(() => this.card().modifier.enhancement === CardEnhancement.WILD);
  protected readonly isGlass = computed<boolean>(() => this.card().modifier.enhancement === CardEnhancement.GLASS);
  protected readonly isSteel = computed<boolean>(() => this.card().modifier.enhancement === CardEnhancement.STEEL);
  protected readonly isStone = computed<boolean>(() => this.card().modifier.enhancement === CardEnhancement.STONE);
  protected readonly isGold = computed<boolean>(() => this.card().modifier.enhancement === CardEnhancement.GOLD);
  protected readonly isLucky = computed<boolean>(() => this.card().modifier.enhancement === CardEnhancement.LUCKY);

}
