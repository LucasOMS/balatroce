import { PlayOrDiscardAction } from "./actions/play-or-discard.action";
import { RearrangeConsumablesAction } from "./actions/rearrange-consumables.action";
import { RearrangeHandAction } from "./actions/rearrange-hand.action";
import { SellConsumableAction } from "./actions/sell-consumable.action";
import { SellJokerAction } from "./actions/sell-joker.action";
import { ShopAction } from "./actions/shop.action";
import { SkipOrSelectBlindAction } from "./actions/skip-or-select-blind.action";
import { UseConsumableAction } from "./actions/use-consumable.action";
import { StartRunAction } from "./actions/start-run.action";

export type ChatAction =
  | PlayOrDiscardAction
  | RearrangeConsumablesAction
  | RearrangeHandAction
  | SellConsumableAction
  | SellJokerAction
  | ShopAction
  | SkipOrSelectBlindAction
  | UseConsumableAction
  | StartRunAction;
