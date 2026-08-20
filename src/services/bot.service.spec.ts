import { Logger } from "@nestjs/common";
import { ChatAction } from "../interfaces/chat-action";
import { BotMethod } from "../interfaces/bot-request";
import { BotHttpService } from "./bot-http.service";
import { BotService } from "./bot.service";

describe("BotService", () => {
  let sendRequest: jest.Mock;
  let service: BotService;

  beforeEach(() => {
    sendRequest = jest.fn();
    service = new BotService(
      {sendRequest, awaitInit: jest.fn()} as unknown as BotHttpService,
      {log: jest.fn()} as unknown as Logger,
    );
  });

  it("plays directly when card indexes are already increasing", async () => {
    const action: ChatAction = {
      method: BotMethod.PLAY,
      params: {cards: [0, 2, 4]},
    };
    sendRequest.mockResolvedValueOnce({});

    await service.useRaw(action);

    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(sendRequest).toHaveBeenCalledWith(action);
  });

  it("rearranges selected slots before playing when card indexes are not increasing", async () => {
    sendRequest
      .mockResolvedValueOnce({hand: {count: 6}})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await service.useRaw({
      method: BotMethod.PLAY,
      params: {cards: [4, 1, 3]},
    });

    expect(sendRequest.mock.calls.map(([request]) => request)).toEqual([
      {method: BotMethod.GAMESTATE},
      {
        method: BotMethod.REARRANGE,
        params: {hand: [0, 4, 2, 1, 3, 5]},
      },
      {
        method: BotMethod.PLAY,
        params: {cards: [1, 3, 4]},
      },
    ]);
  });
});
