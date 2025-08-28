import { BotRequest, BotRequestName } from "../bot-request";

export interface UseConsumableAction extends BotRequest {
  name: BotRequestName.USE_CONSUMABLE;
  arguments: {
    index: number;
  };
}
