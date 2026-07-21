import { SellConsumableAction } from "../interfaces/actions/sell-consumable.action";
import { extractArguments, getCardIndex } from "./utils/card-utils";
import { BotMethod } from "../interfaces/bot-request";

/**
 * Parse sell consumable action
 * Example: !vendreconso 1
 */
export function parseSellConsumableAction(
  input: string,
): SellConsumableAction | null {
  const args = extractArguments(input);
  if (args.length !== 1) return null;
  const index = getCardIndex(args[0]);
  if (index === null) return null;
  return { method: BotMethod.SELL, params: { consumable: index } };
}
