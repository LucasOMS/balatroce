import { extractArguments, getCardIndexes } from "./utils/card-utils";
import { BotRequestName } from "../interfaces/bot-request";
import { RearrangeJokerAction } from "../interfaces/actions/rearrange-joker.action";

/**
 * Parse rearrange joker action
 * Example: !arrangerjokers 3 2 4 5
 */
export function parseRearrangeJokersAction(
  input: string,
): RearrangeJokerAction | null {
  const args = extractArguments(input);

  if (args.length === 0) {
    return null;
  }

  const cards = getCardIndexes(args);
  if (cards === null) {
    return null;
  }

  return {
    name: BotRequestName.REARRANGE_JOKERS,
    arguments: {
      jokers: cards,
    },
  };
}
