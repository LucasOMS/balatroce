import { ChatAction } from "../interfaces/chat-action";
import { ActionKeyword } from "../enums/action-keywords.enum";
import { parsePlayAction, parseDiscardAction } from "./play-or-discard.parser";
import { parseRearrangeConsumablesAction } from "./rearrange-consumables.parser";
import { parseRearrangeHandAction } from "./rearrange-hand.parser";
import { parseSellConsumableAction } from "./sell-consumable.parser";
import { parseSellJokerAction } from "./sell-joker.parser";
import { parseShopAction } from "./shop.parser";
import { parseSelectBlindAction, parseSkipBlindAction } from "./skip-or-select-blind.parser";
import { parseUseConsumableAction } from "./use-consumable.parser";
import { parseStartRunAction } from "./start-run.parser";
import { parseRearrangeJokersAction } from "./rearrange-jokers.parser";

export { ActionKeyword };

export function parseAllParser(msg: string): ChatAction | null {
  const normalized = msg.toLowerCase().trim();

  const action = extractName(normalized);

  switch (action as ActionKeyword) {
    case ActionKeyword.Play:
      return parsePlayAction(normalized);
    case ActionKeyword.SelectBlind:
      return parseSelectBlindAction(normalized);
    case ActionKeyword.Discard:
      return parseDiscardAction(normalized);
    case ActionKeyword.RearrangeHand:
      return parseRearrangeHandAction(normalized);
    case ActionKeyword.RearrangeConsumables:
      return parseRearrangeConsumablesAction(normalized);
    case ActionKeyword.RearrangeJokers:
      return parseRearrangeJokersAction(normalized);
    case ActionKeyword.SellConsumable:
      return parseSellConsumableAction(normalized);
    case ActionKeyword.SellJoker:
      return parseSellJokerAction(normalized);
    case ActionKeyword.SkipBlind:
      return parseSkipBlindAction(normalized);
    case ActionKeyword.UseConsumable:
      return parseUseConsumableAction(normalized);
    case ActionKeyword.BuyCard:
      return parseShopAction(normalized, "buy_card");
    case ActionKeyword.BuyVoucher:
      return parseShopAction(normalized, "redeem_voucher");
    case ActionKeyword.NextRound:
      return parseShopAction(normalized, "next_round");
    case ActionKeyword.Reroll:
      return parseShopAction(normalized, "reroll");
    case ActionKeyword.StartRun:
      return parseStartRunAction(normalized);
  }
  return null;
}

/**
 * Extract name of the action (not including !)
 */
function extractName(input: string): string {
  const sanitized = input.startsWith("!") ? input.slice(1) : input;
  const words = sanitized.trim().split(/\s+/);
  return words[0] ?? "";
}
