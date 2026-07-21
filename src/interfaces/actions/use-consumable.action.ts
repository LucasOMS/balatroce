import { BotRequest, BotMethod } from "../bot-request";
import { CardIndexes } from "../../types/card-indexes.type";

export interface UseConsumableAction extends BotRequest {
  method: BotMethod.USE;
  params: {
    /** 0-based index of consumable to use */
    consumable: number;
    /** 0-based indices of target hand cards (for consumables that require selection) */
    cards?: CardIndexes;
  };
}
