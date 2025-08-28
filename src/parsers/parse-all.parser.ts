import { ChatAction } from "../interfaces/chat-action";
import { parsePlayOrDiscardAction } from "./play-or-discard.parser";
import { parseRearrangeConsumablesAction } from "./rearrange-consumables.parser";
import { parseRearrangeHandAction } from "./rearrange-hand.parser";
import { parseSellConsumableAction } from "./sell-consumable.parser";
import { parseSellJokerAction } from "./sell-joker.parser";
import { parseShopAction } from "./shop.parser";
import { parseSkipOrSelectBlindAction } from "./skip-or-select-blind.parser";
import { parseUseConsumableAction } from "./use-consumable.parser";
import { parseStartRunAction } from "./start-run.parser";
import { parseRearrangeJokersAction } from "./rearrange-jokers.parser";

export function parseAllParser(msg: string): ChatAction | null {
  const normalized = msg.toLowerCase().trim();

  if (!normalized.startsWith("!")) {
    return null;
  }

  const action = extractName(normalized);

  switch (action) {
    case "jouer":
      return parsePlayOrDiscardAction(normalized, "play_hand");
    case "selectionner": // If no arguments, it's select blind; if arguments, it's play hand
      return parseSkipOrSelectBlindAction(normalized, "select");
    case "retirer":
      return parsePlayOrDiscardAction(normalized, "discard");
    case "arranger":
      return parseRearrangeHandAction(normalized);
    case "arrangerconso":
      return parseRearrangeConsumablesAction(normalized);
    case "arrangerjokers":
      return parseRearrangeJokersAction(normalized);
    case "vendreconso":
      return parseSellConsumableAction(normalized);
    case "vendrejoker":
      return parseSellJokerAction(normalized);
    case "passer":
      return parseSkipOrSelectBlindAction(normalized, "skip");
    case "conso":
      return parseUseConsumableAction(normalized);
    case "acheter":
      return parseShopAction(normalized, "buy_card");
    case "acheterutiliser":
      return parseShopAction(normalized, "buy_and_use_card");
    case "achetercoupon":
      return parseShopAction(normalized, "redeem_voucher");
    case "quitter":
      return parseShopAction(normalized, "next_round");
    case "changer":
      return parseShopAction(normalized, "reroll");
    case "commencer":
      return parseStartRunAction(normalized);
  }
  return null;
}

/**
 * Extract name of the action (not including !)
 */
function extractName(input: string): string {
  // Remove leading "!" if present
  const sanitized = input.startsWith("!") ? input.slice(1) : input;

  // Split by spaces and return the first word
  const words = sanitized.trim().split(/\s+/);
  return words[0] ?? "";
}
