import { BotRequest, BotMethod } from "../bot-request";
import { CardIndexes } from "../../types/card-indexes.type";

/** Select a card from an opened booster pack */
export interface PackSelectAction extends BotRequest {
  method: BotMethod.PACK;
  params: {
    /** 0-based index of card to select from the pack */
    card: number;
    /** 0-based indices of hand cards to target (for Tarot/Spectral that require selection) */
    targets?: CardIndexes;
  };
}

/** Skip an opened booster pack without selecting a card */
export interface PackSkipAction extends BotRequest {
  method: BotMethod.PACK;
  params: {
    skip: true;
  };
}

export type PackAction = PackSelectAction | PackSkipAction;
