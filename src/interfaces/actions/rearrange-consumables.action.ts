import { BotRequest, BotMethod } from "../bot-request";
import { CardIndexes } from "../../types/card-indexes.type";

/** Rearrange cards in hand */
export interface RearrangeHandAction extends BotRequest {
  method: BotMethod.REARRANGE;
  params: {
    hand: CardIndexes;
  };
}

/** Rearrange jokers */
export interface RearrangeJokersAction extends BotRequest {
  method: BotMethod.REARRANGE;
  params: {
    jokers: CardIndexes;
  };
}

/** Rearrange consumables */
export interface RearrangeConsumablesAction extends BotRequest {
  method: BotMethod.REARRANGE;
  params: {
    consumables: CardIndexes;
  };
}

export type RearrangeAction =
  | RearrangeHandAction
  | RearrangeJokersAction
  | RearrangeConsumablesAction;
