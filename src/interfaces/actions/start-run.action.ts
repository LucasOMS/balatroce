import { Deck } from "src/enums/deck.enum";
import { BotRequest, BotRequestName } from "../bot-request";

export interface StartRunAction extends BotRequest {
  name: BotRequestName.START_RUN;
  arguments: {
    deck: Deck; // Deck name
    stake: number; // Difficulty level 1-8
    seed?: string; // Seed for run generation
    challenge?: string; // Challenge name
    log_path?: string;
  };
}
