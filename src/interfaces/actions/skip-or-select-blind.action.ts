import { BotRequest, BotMethod } from "../bot-request";

export interface SelectBlindAction extends BotRequest {
  method: BotMethod.SELECT;
  params?: Record<string, never>;
}

export interface SkipBlindAction extends BotRequest {
  method: BotMethod.SKIP;
  params?: Record<string, never>;
}
