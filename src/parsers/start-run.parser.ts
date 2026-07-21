import { StartRunAction } from "../interfaces/actions/start-run.action";
import { Deck } from "../enums/deck.enum";
import { Stake } from "../enums/stake.enum";
import { extractArguments } from "./utils/card-utils";
import { BotMethod } from "../interfaces/bot-request";

/**
 * Parse start run action
 * Example: !commencer RED WHITE seed123
 * Deck values: RED, BLUE, YELLOW, GREEN, BLACK, MAGIC, NEBULA, GHOST, ABANDONED, CHECKERED, ZODIAC, PAINTED, ANAGLYPH, PLASMA, ERRATIC
 * Stake values: WHITE, RED, GREEN, BLACK, BLUE, PURPLE, ORANGE, GOLD
 */
export function parseStartRunAction(input: string): StartRunAction | null {
  const args = extractArguments(input);

  if (args.length < 2) {
    return null;
  }

  const deckName = args[0].toUpperCase();
  const stakeName = args[1].toUpperCase();

  if (!Object.values(Deck).includes(deckName as Deck)) {
    return null;
  }

  if (!Object.values(Stake).includes(stakeName as Stake)) {
    return null;
  }

  const result: StartRunAction = {
    method: BotMethod.START,
    params: {
      deck: deckName as Deck,
      stake: stakeName as Stake,
    },
  };

  if (args.length > 2 && args[2]) {
    result.params.seed = args[2];
  }

  return result;
}
