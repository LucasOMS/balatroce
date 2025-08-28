import { StartRunAction } from "../interfaces/actions/start-run.action";
import { Deck } from "../enums/deck.enum";
import { extractArguments } from "./utils/card-utils";
import { BotRequestName } from "../interfaces/bot-request";

/**
 * Parse start run action
 * Example: !commencer "Red Deck" 3 seed123 "Challenge Name"
 */
export function parseStartRunAction(input: string): StartRunAction | null {
  const args = extractArguments(input);

  // Need at least deck and stake
  if (args.length < 2) {
    return null;
  }

  const deckName = args[0];
  const stakeStr = args[1];

  // Validate deck
  if (!Object.values(Deck).includes(deckName as Deck)) {
    return null;
  }

  // Validate stake
  const stake = parseInt(stakeStr, 10);
  if (isNaN(stake) || stake < 1 || stake > 8) {
    return null;
  }

  const result: StartRunAction = {
    name: BotRequestName.START_RUN,
    arguments: {
      deck: deckName as Deck,
      stake: stake,
    },
  };

  // Optional parameters
  if (args.length > 2 && args[2]) {
    result.arguments.seed = args[2];
  }

  if (args.length > 3 && args[3]) {
    result.arguments.challenge = args[3];
  }

  if (args.length > 4 && args[4]) {
    result.arguments.log_path = args[4];
  }

  return result;
}
