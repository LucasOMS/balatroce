import { join } from "path";
import { Deck } from "../enums/deck.enum";
import { Stake } from "../enums/stake.enum";

/**
 * Liste des decks joués, dans l'ordre. On enchaîne tous les decks de cette
 * liste pour une même difficulté avant de passer à la difficulté suivante
 * (voir {@link DIFFICULTIES}).
 */
export const PLAY_SET: Deck[] = [
  Deck.RED,
  Deck.BLUE,
  Deck.YELLOW,
  Deck.GREEN,
  Deck.BLACK,
  Deck.MAGIC,
  Deck.NEBULA,
  Deck.GHOST,
  Deck.ABANDONED,
  Deck.CHECKERED,
  Deck.ZODIAC,
  Deck.PAINTED,
  Deck.ANAGLYPH,
  Deck.PLASMA,
  Deck.ERRATIC,
];

/** Liste des difficultés (stakes), de la plus petite à la plus grande. */
export const DIFFICULTIES: Stake[] = [
  Stake.WHITE,
  Stake.RED,
  Stake.GREEN,
  Stake.BLACK,
  Stake.BLUE,
  Stake.PURPLE,
  Stake.ORANGE,
  Stake.GOLD,
];

/**
 * Chemin du fichier de progression (deck/difficulté en cours). Placé dans
 * `/data` (persistance locale, ignoré par git, voir .gitignore), avec
 * possibilité de le surcharger via une variable d'environnement.
 */
export const PROGRESSION_STATE_PATH =
  process.env.PROGRESSION_PATH ??
  join(process.cwd(), "data", "progression-state.json");

