import { BotRequest, BotMethod } from "../bot-request";

/** Sell a joker by its 0-based index */
export interface SellJokerAction extends BotRequest {
  method: BotMethod.SELL;
  params: {
    joker: number;
  };
}

/** Sell a consumable by its 0-based index */
export interface SellConsumableAction extends BotRequest {
  method: BotMethod.SELL;
  params: {
    consumable: number;
  };
}

export type SellAction = SellJokerAction | SellConsumableAction;
