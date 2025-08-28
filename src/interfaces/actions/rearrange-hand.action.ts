import { BotRequest, BotRequestName } from "../bot-request";
import { CardIndexes } from "../../types/card-indexes.type";

export interface RearrangeHandAction extends BotRequest {
  name: BotRequestName.REARRANGE_HAND;
  arguments: {
    cards: CardIndexes;
  };
}
