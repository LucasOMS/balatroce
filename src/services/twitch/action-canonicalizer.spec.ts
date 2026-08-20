import { BotMethod } from "../../interfaces/bot-request";
import { canonicalizeAction } from "./action-canonicalizer";

describe("action canonicalizer", () => {
  it("preserves play card order", () => {
    const ascending = canonicalizeAction({
      method: BotMethod.PLAY,
      params: {cards: [0, 1, 2]},
    });
    const descending = canonicalizeAction({
      method: BotMethod.PLAY,
      params: {cards: [2, 1, 0]},
    });

    expect(ascending.key).not.toBe(descending.key);
    expect(descending.canonicalAction).toEqual({
      method: BotMethod.PLAY,
      params: {cards: [2, 1, 0]},
    });
  });

  it("still canonicalizes discard card order", () => {
    const ascending = canonicalizeAction({
      method: BotMethod.DISCARD,
      params: {cards: [0, 1, 2]},
    });
    const descending = canonicalizeAction({
      method: BotMethod.DISCARD,
      params: {cards: [2, 1, 0]},
    });

    expect(ascending.key).toBe(descending.key);
    expect(descending.canonicalAction).toEqual({
      method: BotMethod.DISCARD,
      params: {cards: [0, 1, 2]},
    });
  });
});
