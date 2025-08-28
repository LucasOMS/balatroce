import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CardSet, GameCycleState, GameState } from "src/interfaces/game-state";
import { BotService } from "./bot.service";
import { firstValueFrom, Subject } from "rxjs";
import { ChatAction } from "../interfaces/chat-action";
import { BotRequestName } from "../interfaces/bot-request";
import { PlayOrDiscardAction } from "../interfaces/actions/play-or-discard.action";
import { RearrangeConsumablesAction } from "../interfaces/actions/rearrange-consumables.action";
import { RearrangeHandAction } from "src/interfaces/actions/rearrange-hand.action";
import { UseConsumableAction } from "src/interfaces/actions/use-consumable.action";
import { SellConsumableAction } from "../interfaces/actions/sell-consumable.action";
import { SellJokerAction } from "src/interfaces/actions/sell-joker.action";
import { ShopAction } from "src/interfaces/actions/shop.action";
import { RearrangeJokerAction } from "../interfaces/actions/rearrange-joker.action";

@Injectable()
export class GameCycleService implements OnModuleInit {
  private currentGameState: GameState;
  private readonly actionsSubject = new Subject<ChatAction>();

  constructor(
    private readonly botService: BotService,
    private readonly logger: Logger,
  ) {}

  public async onModuleInit(): Promise<any> {
    this.currentGameState = await this.botService.getCurrentState();

    // Start steps without waiting because await would lock the module init
    void this.nextStep();
  }

  public isActionValid(action: ChatAction): boolean {
    // Check if action is available in the current state
    let validActions: BotRequestName[] = [];
    switch (this.currentGameState.state) {
      case GameCycleState.GAME_OVER:
        validActions = [BotRequestName.GO_TO_MENU];
        break;
      case GameCycleState.ROUND_EVAL:
        validActions = [
          BotRequestName.CASH_OUT,
          BotRequestName.SELL_CONSUMABLE,
          BotRequestName.SELL_JOKER,
          BotRequestName.USE_CONSUMABLE,
          BotRequestName.REARRANGE_JOKERS,
        ];
        break;
      case GameCycleState.BLIND_SELECT:
        validActions = [
          BotRequestName.SKIP_OR_SELECT_BLIND,
          BotRequestName.SELL_JOKER,
          BotRequestName.SELL_CONSUMABLE,
          BotRequestName.USE_CONSUMABLE,
          BotRequestName.REARRANGE_JOKERS,
        ];
        break;
      case GameCycleState.MENU:
        validActions = [BotRequestName.START_RUN];
        break;
      case GameCycleState.SELECTING_HAND:
        validActions = [
          BotRequestName.PLAY_HAND_OR_DISCARD,
          BotRequestName.REARRANGE_HAND,
          BotRequestName.SELL_JOKER,
          BotRequestName.SELL_CONSUMABLE,
          BotRequestName.USE_CONSUMABLE,
          BotRequestName.REARRANGE_JOKERS,
        ];
        break;
      case GameCycleState.SHOP:
        validActions = [
          BotRequestName.SHOP,
          BotRequestName.SELL_JOKER,
          BotRequestName.SELL_CONSUMABLE,
          BotRequestName.USE_CONSUMABLE,
          BotRequestName.REARRANGE_JOKERS,
        ];
        break;
    }
    if (validActions.every((a) => a !== action.name)) {
      return false;
    }

    const consumableCount = this.currentGameState.consumables.cards.length;
    const handSize = this.currentGameState.hand.cards.length;
    const jokerCount = this.currentGameState.jokers.cards.length;
    const discardLeft = this.currentGameState.game.current_round.discards_left;
    const dollars = this.currentGameState.game.dollars;

    const jokerEmptySlotCount =
      this.currentGameState.jokers.config.card_limit -
      this.currentGameState.jokers.config.card_count;
    const consumableEmptySlotCount =
      this.currentGameState.consumables.config.card_limit -
      this.currentGameState.consumables.config.card_count;

    switch (action.name) {
      case BotRequestName.PLAY_HAND_OR_DISCARD:
        const playOrDiscardAction = action as unknown as PlayOrDiscardAction;
        const cardCount = playOrDiscardAction.arguments.cards.length;
        if (cardCount <= 0 || cardCount > 5) {
          return false;
        }
        if (
          playOrDiscardAction.arguments.action === "discard" &&
          discardLeft === 0
        ) {
          return false;
        }
        break;
      case BotRequestName.REARRANGE_CONSUMABLES:
        const rearrangeConsumablesAction =
          action as unknown as RearrangeConsumablesAction;
        if (
          !validateIndexes(
            consumableCount,
            rearrangeConsumablesAction.arguments.cards,
          )
        ) {
          return false;
        }
        break;
      case BotRequestName.REARRANGE_HAND:
        const rearrangeHandAction = action as unknown as RearrangeHandAction;
        if (!validateIndexes(handSize, rearrangeHandAction.arguments.cards)) {
          return false;
        }
        break;
      case BotRequestName.REARRANGE_JOKERS:
        const rearrangeJokersAction = action as unknown as RearrangeJokerAction;
        if (!validateIndexes(jokerCount, rearrangeJokersAction.arguments.jokers)) {
          return false;
        }
        break;


      case BotRequestName.USE_CONSUMABLE:
        const useConsumableAction = action as unknown as UseConsumableAction;
        if (useConsumableAction.arguments.index > consumableCount - 1) {
          return false;
        }
        break;

      case BotRequestName.SELL_CONSUMABLE:
        const sellConsumableAction = action as unknown as SellConsumableAction;
        if (sellConsumableAction.arguments.index > consumableCount - 1) {
          return false;
        }
        break;

      case BotRequestName.SELL_JOKER:
        const sellJokerAction = action as unknown as SellJokerAction;
        if (sellJokerAction.arguments.index > jokerCount - 1) {
          return false;
        }
        break;

      case BotRequestName.SHOP:
        const shopAction = action as unknown as ShopAction;
        switch (shopAction.arguments.action) {
          case "buy_card":
            const cardsToBuy = this.currentGameState.shop_jokers.cards;
            const indexToBuy = shopAction.arguments.index;
            // Invalid index
            if (indexToBuy > cardsToBuy.length) {
              return false;
            }
            const cardToBuy = cardsToBuy[indexToBuy];

            // Not enough gold
            if (dollars < cardToBuy.cost) {
              return false;
            }

            // Not enough space for joker
            if (
              cardToBuy.ability.set === CardSet.JOKER &&
              jokerEmptySlotCount <= 0
            ) {
              return false;
            }

            // Not enough space for consumable
            if (consumableEmptySlotCount === 0) {
              return false;
            }
            break;
          case "buy_and_use_card":
            const cardsToBuyAndUse = this.currentGameState.shop_jokers.cards;
            const indexToBuyAndUse = shopAction.arguments.index;
            // Invalid index
            if (indexToBuyAndUse > cardsToBuyAndUse.length) {
              return false;
            }
            const cardToBuyAndUse = cardsToBuyAndUse[indexToBuyAndUse];

            // Not enough gold
            if (dollars < cardToBuyAndUse.cost) {
              return false;
            }
            break;
          case "reroll":
            // Not enough dollars
            if (
              this.currentGameState.game.current_round.free_rerolls === 0 &&
              this.currentGameState.game.current_round.reroll_cost > dollars
            ) {
              return false;
            }

            break;
          case "redeem_voucher":
            const vouchersToBuy = this.currentGameState.shop_vouchers.cards;

            // Invalid index
            if (shopAction.arguments.index > vouchersToBuy.length) {
              return false;
            }

            const voucherToBuy = vouchersToBuy[shopAction.arguments.index];
            // Not enough dollars
            if (dollars < voucherToBuy.cost) {
              return false;
            }
            break;
        }
    }

    return true;
  }

  public registerChatAction(request: ChatAction) {
    if (!this.isActionValid(request)) {
      this.logger.warn("Try to use an invalid chat action : ", request);
      return;
    }
    this.actionsSubject.next(request);
  }

  private async nextStep() {
    // While we have an automatic action to perform, do it

    let didAutoAction = false;
    do {
      didAutoAction = false;
      this.currentGameState = await this.botService.getCurrentState();
      // Check for automatic actions
      switch (this.currentGameState.state) {
        case GameCycleState.GAME_OVER:
          await this.botService.goToMenu();
          didAutoAction = true;
          break;

        case GameCycleState.MENU:
          await this.botService.startRun();
          didAutoAction = true;
          break;

        case GameCycleState.ROUND_EVAL:
          await this.botService.cashOut();
          didAutoAction = true;
          break;
      }
    } while (didAutoAction);

    this.logger.log("Attente d'une action");
    const action = await firstValueFrom(this.actionsSubject.asObservable());
    await this.botService.useRaw(action);

    await this.nextStep();
  }
}

/**
 * Validates that an array has the given length
 * and contains exactly all numbers from 0 to length-1
 * @param length The expected length of the array
 * @param arr The array to validate
 * @returns true if valid, false otherwise
 */
function validateIndexes(length: number, arr: number[]): boolean {
  if (arr.length !== length) {
    return false;
  }

  // Create a Set of the array to remove duplicates
  const uniqueNumbers = new Set(arr);

  // Check that each number from 0 to length-1 is present
  for (let i = 0; i < length; i++) {
    if (!uniqueNumbers.has(i)) {
      return false;
    }
  }

  return true;
}
