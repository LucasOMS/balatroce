export enum PerformedActionType {
  SELECT_BLIND = "select_blind",
  SKIP_BLIND = "skip_blind",
  REROLL = "reroll",
  NEXT_ROUND = "next_round",
  START_RUN = "start_run",
  PLAY = "play",
  DISCARD = "discard",
  REARRANGE_HAND = "rearrange_hand",
  SELL_JOKER = "sell_joker",
  SELL_CONSUMABLE = "sell_consumable",
  USE_CONSUMABLE = "use_consumable",
  REARRANGE_JOKERS = "rearrange_jokers",
  REARRANGE_CONSUMABLES = "rearrange_consumables",
  BUY_CARD = "buy_card",
  BUY_VOUCHER = "buy_voucher",
  BUY_PACK = "buy_pack",
  PACK_SELECT = "pack_select",
  PACK_SKIP = "pack_skip",
}

export interface PlayingCardSnapshot {
  rank: string;
  suit: string;
  label: string;
}

export interface GameItemSnapshot {
  label: string;
}

export type PerformedAction =
  | {
      type:
        | PerformedActionType.SELECT_BLIND
        | PerformedActionType.SKIP_BLIND
        | PerformedActionType.REROLL
        | PerformedActionType.NEXT_ROUND
        | PerformedActionType.START_RUN
        | PerformedActionType.PACK_SKIP;
    }
  | {
      type:
        | PerformedActionType.PLAY
        | PerformedActionType.DISCARD
        | PerformedActionType.REARRANGE_HAND;
      cards: PlayingCardSnapshot[];
    }
  | {
      type:
        | PerformedActionType.SELL_JOKER
        | PerformedActionType.SELL_CONSUMABLE
        | PerformedActionType.BUY_CARD
        | PerformedActionType.BUY_VOUCHER
        | PerformedActionType.BUY_PACK;
      item: GameItemSnapshot;
    }
  | {
      type: PerformedActionType.USE_CONSUMABLE | PerformedActionType.PACK_SELECT;
      item: GameItemSnapshot;
      cards: PlayingCardSnapshot[];
    }
  | {
      type:
        | PerformedActionType.REARRANGE_JOKERS
        | PerformedActionType.REARRANGE_CONSUMABLES;
      items: GameItemSnapshot[];
    };
