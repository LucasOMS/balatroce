import { UseConsumableAction } from "../interfaces/actions/use-consumable.action";
import { extractArguments, getCardIndex } from "./utils/card-utils";
import { BotMethod } from "../interfaces/bot-request";

/**
 * Parse use consumable action
 * Example: !conso 1
 */
export function parseUseConsumableAction(
  input: string,
): UseConsumableAction | null {
  const args = extractArguments(input);
  if (args.length !== 1) return null;
  const index = getCardIndex(args[0]);
  if (index === null) return null;
  return { method: BotMethod.USE, params: { consumable: index } };
}
