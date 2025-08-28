import { BotRequest, BotRequestName } from "../bot-request";
import { CardIndexes } from "../../types/card-indexes.type";

export interface RearrangeConsumablesAction extends BotRequest {
  name: BotRequestName.REARRANGE_CONSUMABLES;
  arguments: {
    cards: CardIndexes;
  };
}
