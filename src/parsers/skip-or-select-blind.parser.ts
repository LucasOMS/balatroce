import { SkipOrSelectBlindAction } from "../interfaces/actions/skip-or-select-blind.action";
import { extractArguments } from "./utils/card-utils";
import { BotRequestName } from "../interfaces/bot-request";

/**
 * Parse skip or select blind action
 * Examples: !passer or !jouer (without arguments)
 */
export function parseSkipOrSelectBlindAction(
  input: string,
  actionType: "skip" | "select",
): SkipOrSelectBlindAction | null {
  const args = extractArguments(input);

  // These actions should not have arguments
  if (args.length !== 0) {
    return null;
  }

  return {
    name: BotRequestName.SKIP_OR_SELECT_BLIND,
    arguments: {
      action: actionType,
    },
  };
}
