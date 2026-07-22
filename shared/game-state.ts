export enum CardSet {
  DEFAULT = "DEFAULT",
  ENHANCED = "ENHANCED",
  JOKER = "JOKER",
  TAROT = "TAROT",
  PLANET = "PLANET",
  SPECTRAL = "SPECTRAL",
  VOUCHER = "VOUCHER",
  BOOSTER = "BOOSTER",
}

export enum CardSeal {
  RED = "RED",
  BLUE = "BLUE",
  GOLD = "GOLD",
  PURPLE = "PURPLE",
}

export enum CardEdition {
  FOIL = "FOIL",
  HOLO = "HOLO",
  POLYCHROME = "POLYCHROME",
  NEGATIVE = "NEGATIVE",
}

export enum CardEnhancement {
  BONUS = "BONUS",
  MULT = "MULT",
  WILD = "WILD",
  GLASS = "GLASS",
  STEEL = "STEEL",
  STONE = "STONE",
  GOLD = "GOLD",
  LUCKY = "LUCKY",
}

export interface CardModifier {
  seal: CardSeal | null;
  edition: CardEdition | null;
  enhancement: CardEnhancement | null;
  eternal: boolean;
  perishable: number | null;
  rental: boolean;
}

export interface CardState {
  debuff: boolean;
  hidden: boolean;
  highlight: boolean;
}

export interface CardCost {
  sell: number;
  buy: number;
}

export interface CardValue {
  suit?: string;
  rank?: string;
  effect?: string;
}

export interface Card {
  id: number;
  key: string;
  set: CardSet;
  label: string;
  value: CardValue;
  modifier: CardModifier;
  state: CardState;
  cost: CardCost;
}

/** Représente une zone de cartes (main, jokers, consommables, boutique, etc.) */
export interface Area {
  count: number;
  limit: number;
  highlighted_limit: number;
  cards: Card[];
}

export interface Round {
  hands_left: number;
  hands_played: number;
  discards_left: number;
  discards_used: number;
  reroll_cost: number;
  chips: number;
}

export type BlindType = "SMALL" | "BIG" | "BOSS";
export type BlindStatus =
  | "SELECT"
  | "CURRENT"
  | "UPCOMING"
  | "DEFEATED"
  | "SKIPPED";

export interface Blind {
  type: BlindType;
  status: BlindStatus;
  name: string;
  effect: string;
  score: number;
  tag_name: string;
  tag_effect: string;
}

export interface HandInfo {
  order: number;
  level: number;
  chips: number;
  mult: number;
  played: number;
  played_this_round: number;
  example: [string, boolean][];
}

export interface GameState {
  state: import("./game-cycle-state").GameCycleState;
  round_num: number;
  ante_num: number;
  money: number;
  deck: string;
  stake: string;
  seed: string;
  won: boolean;
  used_vouchers: Record<string, boolean>;
  hands: Record<string, HandInfo>;
  round: Round;
  blinds: {
    small: Blind;
    big: Blind;
    boss: Blind;
  };
  jokers: Area;
  consumables: Area;
  /** Deck complet */
  cards: Area;
  /** Cartes en main */
  hand: Area;
  /** Cartes et consommables disponibles à la boutique */
  shop: Area;
  /** Coupons disponibles à la boutique */
  vouchers: Area;
  /** Boosters disponibles à la boutique */
  packs: Area;
  /** Booster ouvert en cours (null si aucun) */
  pack: Area | null;
}

