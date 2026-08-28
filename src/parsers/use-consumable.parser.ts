import { UseConsumableAction } from "../interfaces/actions/use-consumable.action";
import { extractArguments, getCardIndex, getCardIndexes } from "./utils/card-utils";
import { BotMethod } from "../interfaces/bot-request";

/**
 * Parse use consumable actions.
 *
 * Formats:
 *   uc 1       -> use the first consumable without targeting hand cards
 *   uc 2 1 3   -> use the second consumable on hand cards 1 and 3
 */
export function parseUseConsumableAction(
  input: string,
): UseConsumableAction | null {
  const args = extractArguments(input);
  if (args.length === 0) return null;

  const consumable = getCardIndex(args[0]);
  if (consumable === null) return null;

  if (args.length === 1) {
    return { method: BotMethod.USE, params: { consumable } };
  }

  const cards = getCardIndexes(args.slice(1));
  if (cards === null) return null;

  return { method: BotMethod.USE, params: { consumable, cards } };
}
