import { extractArguments, getCardIndexes } from "./utils/card-utils";
import { BotMethod } from "../interfaces/bot-request";
import { RearrangeJokersAction } from "../interfaces/actions/rearrange-joker.action";

/**
 * Parse rearrange joker action
 * Example: !arrangerjokers 3 2 4 5
 */
export function parseRearrangeJokersAction(
  input: string,
): RearrangeJokersAction | null {
  const args = extractArguments(input);
  if (args.length === 0) return null;
  const cards = getCardIndexes(args);
  if (cards === null) return null;
  return { method: BotMethod.REARRANGE, params: { jokers: cards } };
}
