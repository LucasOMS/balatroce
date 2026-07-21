/**
 * JSON-RPC 2.0 method names for the BalatroBot API.
 * See: https://coder.github.io/balatrobot/api
 */
export enum BotMethod {
  HEALTH = "health",
  GAMESTATE = "gamestate",
  START = "start",
  MENU = "menu",
  SAVE = "save",
  LOAD = "load",
  SELECT = "select",
  SKIP = "skip",
  BUY = "buy",
  PACK = "pack",
  SELL = "sell",
  REROLL = "reroll",
  CASH_OUT = "cash_out",
  NEXT_ROUND = "next_round",
  PLAY = "play",
  DISCARD = "discard",
  REARRANGE = "rearrange",
  USE = "use",
  ADD = "add",
  SCREENSHOT = "screenshot",
  SET = "set",
}

export interface BotRequest {
  method: BotMethod;
  params?: Record<string, unknown>;
}
