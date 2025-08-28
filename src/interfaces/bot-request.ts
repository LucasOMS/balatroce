export enum BotRequestName {
  GO_TO_MENU = "go_to_menu",
  PLAY_HAND_OR_DISCARD = "play_hand_or_discard",
  REARRANGE_CONSUMABLES = "rearrange_consumables",
  REARRANGE_JOKERS = "rearrange_jokers",
  REARRANGE_HAND = "rearrange_hand",
  SELL_CONSUMABLE = "sell_consumable",
  SELL_JOKER = "sell_joker",
  SHOP = "shop",
  SKIP_OR_SELECT_BLIND = "skip_or_select_blind",
  START_RUN = "start_run",
  USE_CONSUMABLE = "use_consumable",
  GET_GAME_STATE = "get_game_state",
  CASH_OUT = "cash_out",
}

export interface BotRequest {
  name: BotRequestName;
  arguments: { [key: string]: string | string[] | number | number[] };
}
