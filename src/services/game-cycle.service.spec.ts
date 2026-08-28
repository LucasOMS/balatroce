import { BotMethod } from "../interfaces/bot-request";
import { GameCycleState, GameState } from "../interfaces/game-state";
import { GameCycleService } from "./game-cycle.service";

describe("GameCycleService.isActionValid", () => {
  it("accepts an untargeted consumable outside hand selection", () => {
    const service = serviceWithState(gameState(GameCycleState.SHOP));

    expect(service.isActionValid({
      method: BotMethod.USE,
      params: { consumable: 0 },
    })).toBe(true);
  });

  it("accepts targeted consumable use while hand cards are displayed", () => {
    const service = serviceWithState(gameState(GameCycleState.SELECTING_HAND));

    expect(service.isActionValid({
      method: BotMethod.USE,
      params: { consumable: 0, cards: [1, 3] },
    })).toBe(true);
  });

  it("rejects targeted consumable use when hand cards are not displayed", () => {
    const service = serviceWithState(gameState(GameCycleState.SHOP));

    expect(service.isActionValid({
      method: BotMethod.USE,
      params: { consumable: 0, cards: [1] },
    })).toBe(false);
  });

  it("rejects targeted consumable use with an out-of-range hand card", () => {
    const service = serviceWithState(gameState(GameCycleState.SELECTING_HAND));

    expect(service.isActionValid({
      method: BotMethod.USE,
      params: { consumable: 0, cards: [4] },
    })).toBe(false);
  });

  it("rejects an out-of-range consumable", () => {
    const service = serviceWithState(gameState(GameCycleState.SELECTING_HAND));

    expect(service.isActionValid({
      method: BotMethod.USE,
      params: { consumable: 2 },
    })).toBe(false);
  });
});

function serviceWithState(state: GameState): GameCycleService {
  const service = Object.create(GameCycleService.prototype) as GameCycleService;
  (service as unknown as {currentGameState: GameState}).currentGameState = state;
  return service;
}

function gameState(state: GameCycleState): GameState {
  return {
    state,
    money: 10,
    round: {
      discards_left: 3,
      reroll_cost: 5,
    },
    hand: {
      count: 4,
    },
    jokers: {
      count: 0,
      limit: 5,
    },
    consumables: {
      count: 2,
      limit: 2,
    },
    shop: {
      cards: [],
    },
    vouchers: {
      cards: [],
    },
    packs: {
      cards: [],
    },
  } as unknown as GameState;
}
