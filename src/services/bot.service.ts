import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { BotSocketService } from "./bot-socket.service";
import { StartRunAction } from "../interfaces/actions/start-run.action";
import { Deck } from "../enums/deck.enum";
import { CardIndexes } from "../types/card-indexes.type";
import { PlayOrDiscardAction } from "../interfaces/actions/play-or-discard.action";
import { RearrangeConsumablesAction } from "../interfaces/actions/rearrange-consumables.action";
import { RearrangeHandAction } from "src/interfaces/actions/rearrange-hand.action";
import { SellConsumableAction } from "../interfaces/actions/sell-consumable.action";
import { SellJokerAction } from "../interfaces/actions/sell-joker.action";
import { SkipOrSelectBlindAction } from "../interfaces/actions/skip-or-select-blind.action";
import { UseConsumableAction } from "src/interfaces/actions/use-consumable.action";
import { ShopAction } from "src/interfaces/actions/shop.action";
import { GameState } from "../interfaces/game-state";
import { ChatAction } from "src/interfaces/chat-action";
import { BotRequestName } from "../interfaces/bot-request";

@Injectable()
export class BotService {
  constructor(
    private readonly socketService: BotSocketService,
    private readonly logger: Logger,
  ) {}

  public async getCurrentState(): Promise<GameState> {
    return (await this.socketService.sendMessage({
      name: BotRequestName.GET_GAME_STATE,
      arguments: {},
    })) as unknown as GameState;
  }

  public startRun() {
    this.logger.log("Starting a run");
    const startRun: StartRunAction = {
      name: BotRequestName.START_RUN,
      arguments: {
        stake: 1,
        deck: Deck.RED,
      },
    };
    return this.socketService.sendMessage(startRun);
  }

  public async goToMenu(): Promise<any> {
    this.logger.log("Return to menu");
    return await this.socketService.sendMessage({
      name: BotRequestName.GO_TO_MENU,
      arguments: {},
    });
  }

  public play(cards: CardIndexes) {
    this.logger.log("Play cards ", cards);
    const playAction: PlayOrDiscardAction = {
      name: BotRequestName.PLAY_HAND_OR_DISCARD,
      arguments: {
        action: "play_hand",
        cards,
      },
    };
    return this.socketService.sendMessage(playAction);
  }

  public discard(cards: CardIndexes) {
    this.logger.log("Play cards ", cards);
    const playAction: PlayOrDiscardAction = {
      name: BotRequestName.PLAY_HAND_OR_DISCARD,
      arguments: {
        action: "discard",
        cards,
      },
    };
    return this.socketService.sendMessage(playAction);
  }

  public rearrangeConsumables(order: CardIndexes) {
    this.logger.log("Rearrange consumables; new order :", order);
    const rearrangeConsumableAction: RearrangeConsumablesAction = {
      name: BotRequestName.REARRANGE_CONSUMABLES,
      arguments: {
        cards: order,
      },
    };
    return this.socketService.sendMessage(rearrangeConsumableAction);
  }

  public rearrangeHand(order: CardIndexes) {
    this.logger.log("Rearrange hand; new order :", order);
    const rearrangeHandAction: RearrangeHandAction = {
      name: BotRequestName.REARRANGE_HAND,
      arguments: {
        cards: order,
      },
    };
    return this.socketService.sendMessage(rearrangeHandAction);
  }

  /**
   * @param {number} index 0-based
   */
  public sellConsumable(index: number) {
    this.logger.log("Sell consumable at index :", index);
    const sellConsumableAction: SellConsumableAction = {
      name: BotRequestName.SELL_CONSUMABLE,
      arguments: {
        index,
      },
    };
    return this.socketService.sendMessage(sellConsumableAction);
  }

  public sellJoker(index: number) {
    this.logger.log("Sell joker at index :", index);
    const sellJokerAction: SellJokerAction = {
      name: BotRequestName.SELL_JOKER,
      arguments: {
        index,
      },
    };
    return this.socketService.sendMessage(sellJokerAction);
  }

  public skipBlind() {
    this.logger.log("Skip blind");
    const skipBlindAction: SkipOrSelectBlindAction = {
      name: BotRequestName.SKIP_OR_SELECT_BLIND,
      arguments: {
        action: "skip",
      },
    };
    return this.socketService.sendMessage(skipBlindAction);
  }

  public selectBlind() {
    this.logger.log("Play blind");
    const skipBlindAction: SkipOrSelectBlindAction = {
      name: BotRequestName.SKIP_OR_SELECT_BLIND,
      arguments: {
        action: "select",
      },
    };
    return this.socketService.sendMessage(skipBlindAction);
  }

  /**
   * @param {number} index 0-based
   */
  public useConsumable(index: number) {
    this.logger.log("Use consumable at index :", index);
    const consumableAction: UseConsumableAction = {
      name: BotRequestName.USE_CONSUMABLE,
      arguments: {
        index,
      },
    };
    return this.socketService.sendMessage(consumableAction);
  }

  public cashOut() {
    this.logger.log("Cash Out");
    return this.socketService.sendMessage({
      name: BotRequestName.CASH_OUT,
      arguments: {},
    });
  }

  async useRaw(msg: ChatAction): Promise<any> {
    return await this.socketService.sendMessage(msg);
  }

  public shopActions = {
    buyCard: (index: number, use: boolean) => {
      this.logger.log("Buy card at index :", index);
      const buyCardAction: ShopAction = {
        name: BotRequestName.SHOP,
        arguments: {
          action: use ? "buy_and_use_card" : "buy_card",
          index,
        },
      };
      return this.socketService.sendMessage(buyCardAction);
    },
    redeemVoucher: (index: number) => {
      this.logger.log("Redeem voucher at index :", index);
      const redeemVoucherAction: ShopAction = {
        name: BotRequestName.SHOP,
        arguments: {
          action: "redeem_voucher",
          index,
        },
      };
      return this.socketService.sendMessage(redeemVoucherAction);
    },
    nextRound: () => {
      this.logger.log("Exit shop to next round");
      const nextRoundAction: ShopAction = {
        name: BotRequestName.SHOP,
        arguments: {
          action: "next_round",
        },
      };
      return this.socketService.sendMessage(nextRoundAction);
    },
    reroll: () => {
      this.logger.log("Reroll shop");
      const rerollAction: ShopAction = {
        name: BotRequestName.SHOP,
        arguments: {
          action: "reroll",
        },
      };
      return this.socketService.sendMessage(rerollAction);
    },
  };
}
