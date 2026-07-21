import { PlayAction } from "./actions/play-or-discard.action";
import { DiscardAction } from "./actions/discard.action";
import { RearrangeAction } from "./actions/rearrange-consumables.action";
import { SellAction } from "./actions/sell-consumable.action";
import { BuyAction, RerollAction, NextRoundAction } from "./actions/shop.action";
import { SelectBlindAction, SkipBlindAction } from "./actions/skip-or-select-blind.action";
import { UseConsumableAction } from "./actions/use-consumable.action";
import { StartRunAction } from "./actions/start-run.action";
import { PackAction } from "./actions/pack.action";

export type ChatAction =
  | PlayAction
  | DiscardAction
  | RearrangeAction
  | SellAction
  | BuyAction
  | RerollAction
  | NextRoundAction
  | SelectBlindAction
  | SkipBlindAction
  | UseConsumableAction
  | StartRunAction
  | PackAction;
