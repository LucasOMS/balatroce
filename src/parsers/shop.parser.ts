import { ShopAction } from "../interfaces/actions/shop.action";
import { extractArguments, getCardIndex } from "./utils/card-utils";
import { BotRequestName } from "../interfaces/bot-request";

/**
 * Parse shop actions
 * Examples: !acheterjoker 1, !acheterutiliser 1, !achetercoupon 1, !quitter, !changer
 */
export function parseShopAction(
  input: string,
  actionType:
    | "buy_card"
    | "buy_and_use_card"
    | "redeem_voucher"
    | "next_round"
    | "reroll",
): ShopAction | null {
  const args = extractArguments(input);

  const actionsWithIndex = ["buy_card", "buy_and_use_card", "redeem_voucher"];

  if (actionsWithIndex.includes(actionType)) {
    // These actions require exactly one argument (index)
    if (args.length !== 1) {
      return null;
    }

    const index = getCardIndex(args[0]);
    if (index === null) {
      return null;
    }

    return {
      name: BotRequestName.SHOP,
      arguments: {
        action: actionType as
          | "buy_card"
          | "buy_and_use_card"
          | "redeem_voucher",
        index: index,
      },
    };
  } else {
    // Simple actions should not have arguments
    if (args.length !== 0) {
      return null;
    }

    return {
      name: BotRequestName.SHOP,
      arguments: {
        action: actionType as "next_round" | "reroll",
      },
    };
  }
}
