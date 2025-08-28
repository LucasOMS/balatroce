import { PlayOrDiscardAction } from "../interfaces/actions/play-or-discard.action";
import { extractArguments, getCardIndexes } from "./utils/card-utils";
import { BotRequestName } from "../interfaces/bot-request";

/**
 * Parse play or discard action
 * Examples: !jouer 1 2 3 4 or !retirer 1 2 3 4
 */
export function parsePlayOrDiscardAction(
  input: string,
  actionType: "play_hand" | "discard",
): PlayOrDiscardAction | null {
  const args = extractArguments(input);

  // Cannot have more than 5 cards
  if (args.length > 5) {
    return null;
  }

  const cards = getCardIndexes(args);
  if (cards === null) {
    return null;
  }

  return {
    name: BotRequestName.PLAY_HAND_OR_DISCARD,
    arguments: {
      action: actionType,
      cards: cards,
    },
  };
}
