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
      description: '<span class="action-keyword-letter">J</span>ouer une main', example: `${ActionKeyword.Play} 1 4 3`
    },
  [ActionKeyword.SelectBlind]:
    {
      description: '<span class="action-keyword-letter">S</span>électionner la <span class="action-keyword-letter">b</span>linde',
      example: `${ActionKeyword.SelectBlind}`
    },
  [ActionKeyword.Discard]:
    {
      description: '<span class="action-keyword-letter">D</span>éfausser', example: `${ActionKeyword.Discard} 2 3 6`
    },
  [ActionKeyword.RearrangeHand]: {
    description: '<span class="action-keyword-letter">R</span>éorganiser la <span class="action-keyword-letter">m</span>ain',
    example: `${ActionKeyword.RearrangeHand} 1 3 2 4`
  },
  [ActionKeyword.RearrangeConsumables]: {
    description: '<span class="action-keyword-letter">R</span>éorganiser les <span class="action-keyword-letter">c</span>onsommables',
    example: `${ActionKeyword.RearrangeConsumables} 2 1`
  },
  [ActionKeyword.RearrangeJokers]: {
    description: '<span class="action-keyword-letter">R</span>éorganiser les <span class="action-keyword-letter">j</span>okers',
    example: `${ActionKeyword.RearrangeJokers} 3 1 2 4`
  },
  [ActionKeyword.SellConsumable]:
    {
      description: '<span class="action-keyword-letter">V</span>endre un <span class="action-keyword-letter">c</span>onsommable',
      example: `${ActionKeyword.SellConsumable} 2`
    },
  [ActionKeyword.SellJoker]:
    {
      description: '<span class="action-keyword-letter">V</span>endre un <span class="action-keyword-letter">j</span>oker',
      example: `${ActionKeyword.SellJoker} 4`
    },
  [ActionKeyword.SkipBlind]:
    {
      description: '<span class="action-keyword-letter">P</span>asser la <span class="action-keyword-letter">b</span>linde',
      example: `${ActionKeyword.SkipBlind}`
    },
  [ActionKeyword.UseConsumable]:
    {
      description: '<span class="action-keyword-letter">U</span>tiliser un <span class="action-keyword-letter">c</span>onsommable',
      example: `${ActionKeyword.UseConsumable} 1`
    },
  [ActionKeyword.BuyCard]:
    {
      description: '<span class="action-keyword-letter">A</span>cheter une <span class="action-keyword-letter">c</span>arte',
      example: `${ActionKeyword.BuyCard} 2`
    },
  [ActionKeyword.BuyVoucher]:
    {
      description: '<span class="action-keyword-letter">A</span>cheter un <span class="action-keyword-letter">cou</span>pon',
      example: `${ActionKeyword.BuyVoucher} 1`
    },
  [ActionKeyword.BuyPack]:
    {
      description: '<span class="action-keyword-letter">A</span>cheter un <span class="action-keyword-letter">p</span>ack',
      example: `${ActionKeyword.BuyPack} 1`
    },
  [ActionKeyword.PackSelect]:
    {
      description: '<span class="action-keyword-letter">S</span>électionner dans le <span class="action-keyword-letter">P</span>ack',
      example: `${ActionKeyword.PackSelect} 1`
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
    <app-card title="Actions disponibles">
      @for (action of displayedActions(); track action) {
        <div class="flex gap-2 justify-between items-baseline">
          <div class="text-[26px]" [innerHTML]="action.description"></div>
          <div class="text-[22px] text-primary-500 text-right">{{ action.example }}</div>
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

