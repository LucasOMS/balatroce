export enum PerformedActionType {
  SELECT_BLIND = "select_blind",
  SKIP_BLIND = "skip_blind",
  REROLL = "reroll",
  NEXT_ROUND = "next_round",
  START_RUN = "start_run",
  PLAY = "play",
  DISCARD = "discard",
  REARRANGE_HAND = "rearrange_hand",
  PACK_SKIP = "pack_skip",
}

export interface PlayingCardSnapshot {
  rank: string;
  suit: string;
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
    };
