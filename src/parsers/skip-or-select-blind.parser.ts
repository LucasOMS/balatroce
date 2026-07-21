import { SelectBlindAction, SkipBlindAction } from "../interfaces/actions/skip-or-select-blind.action";
import { extractArguments } from "./utils/card-utils";
import { BotMethod } from "../interfaces/bot-request";

/**
 * Parse select blind action
 * Example: !selectionner
 */
export function parseSelectBlindAction(
  input: string,
): SelectBlindAction | null {
  const args = extractArguments(input);
  if (args.length !== 0) return null;
  return { method: BotMethod.SELECT };
}

/**
 * Parse skip blind action
 * Example: !passer
 */
export function parseSkipBlindAction(input: string): SkipBlindAction | null {
  const args = extractArguments(input);
  if (args.length !== 0) return null;
  return { method: BotMethod.SKIP };
}
