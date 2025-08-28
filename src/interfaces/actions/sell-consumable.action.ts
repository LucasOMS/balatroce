import { BotRequest, BotRequestName } from "../bot-request";

export interface SellConsumableAction extends BotRequest {
  name: BotRequestName.SELL_CONSUMABLE;
  arguments: {
    index: number;
  };
}
