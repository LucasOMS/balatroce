import { BotRequest, BotRequestName } from "../bot-request";
import { CardIndexes } from "../../types/card-indexes.type";

export interface RearrangeJokerAction extends BotRequest {
  name: BotRequestName.REARRANGE_JOKERS;
  arguments: {
    jokers: CardIndexes;
  };
}
