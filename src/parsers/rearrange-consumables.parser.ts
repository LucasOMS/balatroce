import { RearrangeConsumablesAction } from "../interfaces/actions/rearrange-consumables.action";
import { extractArguments, getCardIndexes } from "./utils/card-utils";
import { BotMethod } from "../interfaces/bot-request";

/**
 * Parse rearrange consumables action
 * Example: !arrangerconso 3 2 4 5
 */
export function parseRearrangeConsumablesAction(
  input: string,
): RearrangeConsumablesAction | null {
  const args = extractArguments(input);
  if (args.length === 0) return null;
  const cards = getCardIndexes(args);
  if (cards === null) return null;
  return { method: BotMethod.REARRANGE, params: { consumables: cards } };
}
