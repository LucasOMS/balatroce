import { PackAction } from "../interfaces/actions/pack.action";
import { BotMethod } from "../interfaces/bot-request";
import { extractArguments, getCardIndex, getCardIndexes } from "./utils/card-utils";

/**
 * Parse pack selection actions.
 *
 * Formats:
 *   prendrepack skip           → skip pack (sans prendre de carte)
 *   prendrepack 1              → prendre la 1ère carte du pack (index 0-based)
 *   prendrepack 2 1 3          → prendre la 2ème carte, en ciblant les cartes 1 et 3 de la main
 */
export function parsePackAction(input: string): PackAction | null {
  const args = extractArguments(input);

  if (args.length === 0) return null;

  // Skip
  if (args[0] === "skip") {
    return { method: BotMethod.PACK, params: { skip: true } };
  }

  // Card selection
  const cardIndex = getCardIndex(args[0]);
  if (cardIndex === null) return null;

  // No targets
  if (args.length === 1) {
    return { method: BotMethod.PACK, params: { card: cardIndex } };
  }

  // With hand targets (Tarot / Spectral)
  const targetIndexes = getCardIndexes(args.slice(1));
  if (targetIndexes === null) return null;

  return { method: BotMethod.PACK, params: { card: cardIndex, targets: targetIndexes } };
}

