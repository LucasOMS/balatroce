import { RearrangeHandAction } from "../interfaces/actions/rearrange-hand.action";
import { extractArguments, getCardIndexes } from "./utils/card-utils";
import { BotMethod } from "../interfaces/bot-request";

/**
 * Parse rearrange hand action
 * Example: !arranger 3 2 4 5
 */
export function parseRearrangeHandAction(
  input: string,
): RearrangeHandAction | null {
  const args = extractArguments(input);
  if (args.length === 0) return null;
  const cards = getCardIndexes(args);
  if (cards === null) return null;
  return { method: BotMethod.REARRANGE, params: { hand: cards } };
}
