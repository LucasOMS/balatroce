import { Deck } from "src/enums/deck.enum";
import { Stake } from "src/enums/stake.enum";
import { BotRequest, BotMethod } from "../bot-request";

export interface StartRunAction extends BotRequest {
  method: BotMethod.START;
  params: {
    deck: Deck;
    stake: Stake;
    seed?: string;
  };
}
