import { PlayAction } from "../interfaces/actions/play-or-discard.action";
import { DiscardAction } from "../interfaces/actions/discard.action";
import { extractArguments, getCardIndexes } from "./utils/card-utils";
import { BotMethod } from "../interfaces/bot-request";

/**
 * Parse play action
 * Example: !jouer 1 2 3 4
 */
export function parsePlayAction(input: string): PlayAction | null {
  const args = extractArguments(input);
  if (args.length === 0 || args.length > 5) return null;
  const cards = getCardIndexes(args);
  if (cards === null) return null;
  return { method: BotMethod.PLAY, params: { cards } };
}

/**
 * Parse discard action
 * Example: !retirer 1 2 3 4
 */
export function parseDiscardAction(input: string): DiscardAction | null {
  const args = extractArguments(input);
  if (args.length === 0 || args.length > 5) return null;
  const cards = getCardIndexes(args);
  if (cards === null) return null;
  return { method: BotMethod.DISCARD, params: { cards } };
}
