import { Injectable } from "@nestjs/common";
import { BotService } from "./bot.service";
import { OverlayInfo } from "../../shared/overlay-info";
import { ActionKeyword } from "../../shared/action-keyword";
import { GameCycleState } from "../../shared/game-cycle-state";

const ACTIONS_BY_STATE: Record<GameCycleState, ActionKeyword[]> = {
  [GameCycleState.MENU]:               [ActionKeyword.StartRun],
  [GameCycleState.BLIND_SELECT]:       [ActionKeyword.SelectBlind, ActionKeyword.SkipBlind, ActionKeyword.SellConsumable, ActionKeyword.SellJoker, ActionKeyword.UseConsumable, ActionKeyword.RearrangeHand, ActionKeyword.RearrangeConsumables, ActionKeyword.RearrangeJokers],
  [GameCycleState.SELECTING_HAND]:     [ActionKeyword.Play, ActionKeyword.Discard, ActionKeyword.RearrangeHand, ActionKeyword.RearrangeConsumables, ActionKeyword.RearrangeJokers, ActionKeyword.SellConsumable, ActionKeyword.SellJoker, ActionKeyword.UseConsumable],
  [GameCycleState.ROUND_EVAL]:         [],
  [GameCycleState.SHOP]:               [ActionKeyword.BuyCard, ActionKeyword.BuyVoucher, ActionKeyword.BuyPack, ActionKeyword.Reroll, ActionKeyword.NextRound, ActionKeyword.SellConsumable, ActionKeyword.SellJoker, ActionKeyword.UseConsumable, ActionKeyword.RearrangeHand, ActionKeyword.RearrangeConsumables, ActionKeyword.RearrangeJokers],
  [GameCycleState.SMODS_BOOSTER_OPENED]: [ActionKeyword.PackSelect, ActionKeyword.RearrangeHand, ActionKeyword.RearrangeConsumables, ActionKeyword.RearrangeJokers],
  [GameCycleState.GAME_OVER]:          [],
};

/**
 * Responsable de constituer les informations de l'overlay
 * en interrogeant le bot pour obtenir l'état courant du jeu.
 */
@Injectable()
export class OverlayService {
  constructor(private readonly botService: BotService) {}

  async getCurrentInfo(): Promise<OverlayInfo> {
    const gameState = await this.botService.getCurrentState();
    return {
      step: gameState.state,
      availableActions: ACTIONS_BY_STATE[gameState.state] ?? [],
      gameState,
    };
  }
}
