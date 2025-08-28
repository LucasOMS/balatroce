export enum CardSet {
  JOKER = "Joker",
  PLANET = "Planet",
  TAROT = "Tarot",
}

interface ShopCard {
  cost: number;
  ability: {
    set: CardSet;
  };
}

interface Voucher {
  cost: number;
}

export interface GameState {
  state: GameCycleState;
  game: {
    round_scores: any[];
    smods_version: string;
    tarot_rate: number;
    previous_round: any[];
    dollars: number;
    current_round: {
      hands_left: number;
      voucher: any[];
      reroll_cost: number;
      free_rerolls: number;
      discards_left: number;
      hands_played: number;
      discards_used: number;
    };
    round_bonus: any[];
    last_blind: {
      boss: boolean;
      name: string;
    };
    planet_rate: number;
    stake: number;
    win_ante: number;
    inflation: number;
    interest_cap: number;
    used_vouchers: any[];
    skips: number;
    base_reroll_cost: number;
    interest_amount: number;
    shop: any[];
    uncommon_mod: number;
    hands_played: number;
    discount_percent: number;
    max_jokers: number;
    won: boolean;
    voucher_text: string;
    unused_discards: number;
    tags: any[];
    chips: number;
    round: number;
    pseudorandom: any[];
    blind_on_deck: string;
    bankrupt_at: number;
    probabilities: any[];
    selected_back: {
      name: string;
    };
    playing_card_rate: number;
    bosses_used: any[];
    starting_params: any[];
  };
  hand: {
    cards: any[];
    config: {
      card_count: number;
      card_limit: number;
    }
  };
  jokers: {
    cards: any[];
    config: {
      card_count: number;
      card_limit: number;
    }
  };
  consumables: {
    cards: any[];
    config: {
      card_count: number;
      card_limit: number;
    }
  };

  shop_vouchers: {
    cards: Voucher[]
  };
  shop_jokers: {
    cards: ShopCard[]
  };
}

export enum GameCycleState {
  MENU = 11,
  BLIND_SELECT = 7,
  SELECTING_HAND = 1,
  ROUND_EVAL = 8,
  SHOP = 5,
  GAME_OVER = 4,
}
