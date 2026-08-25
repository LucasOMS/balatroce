import {Component, computed, input} from "@angular/core";
import {ActionKeyword} from "@shared/action-keyword";
import {CardComponent} from '../../card.component';

interface Action {
  description: string,
  example: string,
}

const actionsMetadata: Record<ActionKeyword, Action> = {
  [ActionKeyword.Play]:
    {
      description: '<span class="action-keyword-letter">J</span>ouer une main',
      example: `${ActionKeyword.Play} <span class="text-play-card-number">1 4 3</span>`
    },
  [ActionKeyword.SelectBlind]:
    {
      description: '<span class="action-keyword-letter">S</span>électionner la <span class="action-keyword-letter">b</span>linde',
      example: `${ActionKeyword.SelectBlind}`
    },
  [ActionKeyword.Discard]:
    {
      description: '<span class="action-keyword-letter">D</span>éfausser',
      example: `${ActionKeyword.Discard} <span class="text-play-card-number">2 3 6</span>`
    },
  [ActionKeyword.RearrangeHand]: {
    description: '<span class="action-keyword-letter">R</span>éorganiser la <span class="action-keyword-letter">m</span>ain',
    example: `${ActionKeyword.RearrangeHand} <span class="text-play-card-number">1 3 2 4</span>`
  },
  [ActionKeyword.RearrangeConsumables]: {
    description: '<span class="action-keyword-letter">R</span>éorganiser les <span class="action-keyword-letter">c</span>onsommables',
    example: `${ActionKeyword.RearrangeConsumables} <span class="text-consumable-card-number">2 1</span>`
  },
  [ActionKeyword.RearrangeJokers]: {
    description: '<span class="action-keyword-letter">R</span>éorganiser les <span class="action-keyword-letter">j</span>okers',
    example: `${ActionKeyword.RearrangeJokers} <span class="text-joker-number">3 1 2 4</span>`
  },
  [ActionKeyword.SellConsumable]:
    {
      description: '<span class="action-keyword-letter">V</span>endre un <span class="action-keyword-letter">c</span>onsommable',
      example: `${ActionKeyword.SellConsumable} <span class="text-consumable-card-number">2</span>`
    },
  [ActionKeyword.SellJoker]:
    {
      description: '<span class="action-keyword-letter">V</span>endre un <span class="action-keyword-letter">j</span>oker',
      example: `${ActionKeyword.SellJoker} <span class="text-joker-number">4</span>`
    },
  [ActionKeyword.SkipBlind]:
    {
      description: '<span class="action-keyword-letter">P</span>asser la <span class="action-keyword-letter">b</span>linde',
      example: `${ActionKeyword.SkipBlind}`
    },
  [ActionKeyword.UseConsumable]:
    {
      description: '<span class="action-keyword-letter">U</span>tiliser un <span class="action-keyword-letter">c</span>onsommable',
      example: `${ActionKeyword.UseConsumable} <span class="text-consumable-card-number">1</span> <span class="text-play-card-number">1</span>`
    },
  [ActionKeyword.BuyCard]:
    {
      description: '<span class="action-keyword-letter">A</span>cheter une <span class="action-keyword-letter">c</span>arte',
      example: `${ActionKeyword.BuyCard} <span class="text-buyable-number">2</span>`
    },
  [ActionKeyword.BuyVoucher]:
    {
      description: '<span class="action-keyword-letter">A</span>cheter un <span class="action-keyword-letter">cou</span>pon',
      example: `${ActionKeyword.BuyVoucher} <span class="text-voucher-number">1</span>`
    },
  [ActionKeyword.BuyPack]:
    {
      description: '<span class="action-keyword-letter">A</span>cheter un <span class="action-keyword-letter">p</span>ack',
      example: `${ActionKeyword.BuyPack} <span class="text-pack-number">1</span>`
    },
  [ActionKeyword.PackSelect]:
    {
      description: '<span class="action-keyword-letter">S</span>électionner dans le <span class="action-keyword-letter">P</span>ack',
      example: `${ActionKeyword.PackSelect} <span class="text-pack-consumable-number">1</span> <span class="text-play-card-number">1</span>`
    },
  [ActionKeyword.PackSkip]:
    {
      description: '<span class="action-keyword-letter">P</span>asser le <span class="action-keyword-letter">p</span>ack',
      example: `${ActionKeyword.PackSkip}`
    },
  [ActionKeyword.NextRound]:
    {
      description: '<span class="action-keyword-letter">P</span>asser',
      example: `${ActionKeyword.NextRound}`
    },
  [ActionKeyword.Reroll]:
    {
      description: '<span class="action-keyword-letter">R</span>elancer le magasin',
      example: `${ActionKeyword.Reroll}`
    },
  [ActionKeyword.StartRun]:
    {
      description: '<span class="action-keyword-letter">C</span>ommencer une partie',
      example: `${ActionKeyword.StartRun} WHITE RED`
    }
}

@Component({
  selector: "app-available-actions",
  host: {class: "block"},
  template: `
    <app-card title="Actions disponibles" icon="action">
      @for (action of displayedActions(); track action) {
        <div class="flex gap-2 justify-between items-baseline">
          <div class="text-[26px]" [innerHTML]="action.description"></div>
          <div class="text-[22px] text-primary-500 text-right" [innerHTML]="action.example"></div>
        </div>
      }
    </app-card>
  `,
  imports: [
    CardComponent
  ]
})
export class AvailableActionsComponent {
  readonly actions = input<ActionKeyword[]>([]);

  public readonly displayedActions = computed<Action[]>(() => this.actions().map(action => actionsMetadata[action]));

}

