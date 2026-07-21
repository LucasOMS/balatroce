import { BuyCardAction, BuyVoucherAction, RerollAction, NextRoundAction } from "../interfaces/actions/shop.action";
import { extractArguments, getCardIndex } from "./utils/card-utils";
import { BotMethod } from "../interfaces/bot-request";

/**
 * Parse shop actions
 * Examples: !acheter 1, !achetercoupon 1, !quitter, !changer
 */
export function parseShopAction(
  input: string,
  actionType: "buy_card" | "redeem_voucher" | "next_round" | "reroll",
): BuyCardAction | BuyVoucherAction | RerollAction | NextRoundAction | null {
  const args = extractArguments(input);

  switch (actionType) {
    case "buy_card": {
      if (args.length !== 1) return null;
      const index = getCardIndex(args[0]);
      if (index === null) return null;
      return { method: BotMethod.BUY, params: { card: index } };
    }
    case "redeem_voucher": {
      if (args.length !== 1) return null;
      const index = getCardIndex(args[0]);
      if (index === null) return null;
      return { method: BotMethod.BUY, params: { voucher: index } };
    }
    case "next_round": {
      if (args.length !== 0) return null;
      return { method: BotMethod.NEXT_ROUND };
    }
    case "reroll": {
      if (args.length !== 0) return null;
      return { method: BotMethod.REROLL };
    }
  }
}
