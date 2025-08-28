import { BotRequest, BotRequestName } from "../bot-request";
import { CardIndexes } from "../../types/card-indexes.type";

export interface PlayOrDiscardAction extends BotRequest {
  name: BotRequestName.PLAY_HAND_OR_DISCARD;
  arguments: {
    action: "play_hand" | "discard";
    cards: CardIndexes,
  };
}
