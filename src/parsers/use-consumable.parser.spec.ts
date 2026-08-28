import { BotMethod } from "../interfaces/bot-request";
import { parseUseConsumableAction } from "./use-consumable.parser";

describe("parseUseConsumableAction", () => {
  it("parses a consumable without hand targets", () => {
    expect(parseUseConsumableAction("uc 2")).toEqual({
      method: BotMethod.USE,
      params: { consumable: 1 },
    });
  });

  it("parses a consumable with hand targets", () => {
    expect(parseUseConsumableAction("uc 2 1 3")).toEqual({
      method: BotMethod.USE,
      params: { consumable: 1, cards: [0, 2] },
    });
  });

  it.each([
    "uc",
    "uc 0",
    "uc nope",
    "uc 1 0",
    "uc 1 nope",
  ])("rejects invalid input: %s", (input) => {
    expect(parseUseConsumableAction(input)).toBeNull();
  });
});
