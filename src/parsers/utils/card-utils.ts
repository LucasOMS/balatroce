import { CardIndexes } from "../../types/card-indexes.type";

/**
 * Convert a card number (1-based) to a card index (0-based)
 * @param cardNumber The card number provided by the user (1-based)
 * @returns The card index (0-based) or null if invalid
 */
export function getCardIndex(cardNumber: string): number | null {
  const num = parseInt(cardNumber, 10);
  if (isNaN(num) || num < 1) {
    return null;
  }
  return num - 1;
}

/**
 * Convert a list of card numbers (1-based) to card indexes (0-based)
 * @param cardNumbers Array of card numbers provided by the user (1-based)
 * @returns Array of card indexes (0-based) or null if any invalid
 */
export function getCardIndexes(cardNumbers: string[]): CardIndexes | null {
  const indexes: number[] = [];

  for (const cardNumber of cardNumbers) {
    const index = getCardIndex(cardNumber);
    if (index === null) {
      return null;
    }
    indexes.push(index);
  }

  return indexes;
}

/**
 * Extract arguments from input string, excluding the command name
 * @param input The full input string including command
 * @returns Array of arguments
 */
export function extractArguments(input: string): string[] {
  const args = input.split(/\s+/);
  return args.slice(1); // Ignore command name
}
