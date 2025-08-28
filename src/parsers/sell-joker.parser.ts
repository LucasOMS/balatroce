import { SellJokerAction } from "../interfaces/actions/sell-joker.action";
import { extractArguments, getCardIndex } from "./utils/card-utils";
import { BotRequestName } from "../interfaces/bot-request";

/**
 * Parse sell joker action
 * Example: !vendrejoker 1
 */
export function parseSellJokerAction(input: string): SellJokerAction | null {
  const args = extractArguments(input);

  if (args.length !== 1) {
    return null;
  }

  const index = getCardIndex(args[0]);
  if (index === null) {
    return null;
  }

  return {
    name: BotRequestName.SELL_JOKER,
    arguments: {
      index: index,
    },
  };
}
