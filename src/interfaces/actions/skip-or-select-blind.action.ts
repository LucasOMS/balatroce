import { BotRequest, BotRequestName } from "../bot-request";

export interface SkipOrSelectBlindAction extends BotRequest {
  name: BotRequestName.SKIP_OR_SELECT_BLIND;
  arguments: {
    action: "select" | "skip";
  };
}
