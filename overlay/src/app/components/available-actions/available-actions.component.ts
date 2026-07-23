import {Component, computed, input} from "@angular/core";
import {ActionKeyword} from "@shared/action-keyword";

interface Action {
  description: string,
  example: string,
}

const actionsMetadata: Record<ActionKeyword, Action> = {
  [ActionKeyword.Play]: {description: 'Jouer une main', example: `${ActionKeyword.Play} 1 4 3`},
  [ActionKeyword.SelectBlind]: {description: 'Sélectionner la blinde', example: `${ActionKeyword.SelectBlind}`},
  [ActionKeyword.Discard]: {description: 'Défausser', example: `${ActionKeyword.Discard} 2 3 6`},
  [ActionKeyword.RearrangeHand]: {
    description: 'Réorganiser la main',
    example: `${ActionKeyword.RearrangeHand} 1 3 2 4`
  },
  [ActionKeyword.RearrangeConsumables]: {
    description: 'Réorganiser les consommables',
    example: `${ActionKeyword.RearrangeConsumables} 2 1`
  },
  [ActionKeyword.RearrangeJokers]: {
    description: 'Réorganiser les jokers',
    example: `${ActionKeyword.RearrangeJokers} 3 1 2 4`
  },
  [ActionKeyword.SellConsumable]: {description: 'Vendre un consommable', example: `${ActionKeyword.SellConsumable} 2`},
  [ActionKeyword.SellJoker]: {description: 'Vendre un joker', example: `${ActionKeyword.SellJoker} 4`},
  [ActionKeyword.SkipBlind]: {description: 'Passer la blinde', example: `${ActionKeyword.SkipBlind}`},
  [ActionKeyword.UseConsumable]: {description: 'Utiliser un consommable', example: `${ActionKeyword.UseConsumable} 1`},
  [ActionKeyword.BuyCard]: {description: 'Acheter une carte', example: `${ActionKeyword.BuyCard} 2`},
  [ActionKeyword.BuyVoucher]: {description: 'Acheter un bon', example: `${ActionKeyword.BuyVoucher} 1`},
  [ActionKeyword.BuyPack]: {description: 'Acheter un pack', example: `${ActionKeyword.BuyPack} 1`},
  [ActionKeyword.PackSelect]: {description: 'Sélectionner dans le pack', example: `${ActionKeyword.PackSelect} 1`},
  [ActionKeyword.NextRound]: {description: 'Passer', example: `${ActionKeyword.NextRound}`},
  [ActionKeyword.Reroll]: {description: 'Relancer le magasin', example: `${ActionKeyword.Reroll}`},
  [ActionKeyword.StartRun]: {description: 'Commencer une partie', example: `${ActionKeyword.StartRun} WHITE RED`}
}

@Component({
  selector: "app-available-actions",
  host: {class: "block"},
  template: `

    <div class="absolute bottom-10 right-1.5 bg-black/80 text-white p-2 rounded-lg flex flex-col rounded-[16px] border-4 border-white">
      @for (action of displayedActions(); track action) {
        <div class="flex gap-2 justify-between items-baseline">
          <div class="text-[26px]">{{ action.description }}</div>
          <div class="text-[22px]">{{ action.example }}</div>
        </div>
      }
    </div>

  `,
})
export class AvailableActionsComponent {
  readonly actions = input<ActionKeyword[]>([]);

  public readonly displayedActions = computed<Action[]>(() => this.actions().map(action => actionsMetadata[action]));

}

