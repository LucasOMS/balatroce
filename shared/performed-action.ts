export enum PerformedActionType {
  SELECT_BLIND = "select_blind",
  SKIP_BLIND = "skip_blind",
  REROLL = "reroll",
  NEXT_ROUND = "next_round",
  START_RUN = "start_run",
  PACK_SKIP = "pack_skip",
}

export interface PerformedAction {
  type: PerformedActionType;
}
