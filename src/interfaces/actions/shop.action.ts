import { BotRequest, BotMethod } from "../bot-request";

/** Buy a card (joker or consumable) from the shop by 0-based index */
export interface BuyCardAction extends BotRequest {
  method: BotMethod.BUY;
  params: {
    card: number;
  };
}

/** Buy a voucher from the shop by 0-based index */
export interface BuyVoucherAction extends BotRequest {
  method: BotMethod.BUY;
  params: {
    voucher: number;
  };
}

/** Buy a booster pack from the shop by 0-based index */
export interface BuyPackAction extends BotRequest {
  method: BotMethod.BUY;
  params: {
    pack: number;
  };
}

export type BuyAction = BuyCardAction | BuyVoucherAction | BuyPackAction;

export interface RerollAction extends BotRequest {
  method: BotMethod.REROLL;
  params?: Record<string, never>;
}

export interface NextRoundAction extends BotRequest {
  method: BotMethod.NEXT_ROUND;
  params?: Record<string, never>;
}
