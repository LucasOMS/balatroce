import { BotRequest, BotRequestName } from "../bot-request";

export interface SellJokerAction extends BotRequest {
  name: BotRequestName.SELL_JOKER;
  arguments: {
    index: number;
  };
}
