import { BotRequest, BotMethod } from "../bot-request";
import { CardIndexes } from "../../types/card-indexes.type";

export interface DiscardAction extends BotRequest {
  method: BotMethod.DISCARD;
  params: {
    cards: CardIndexes;
  };
}
