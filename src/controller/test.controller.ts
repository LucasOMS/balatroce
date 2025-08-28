import { Controller, Get, Param } from "@nestjs/common";
import { BotService } from "src/services/bot.service";
import { parseAllParser } from "../parsers/parse-all.parser";
import { ChatAction } from "src/interfaces/chat-action";
import { GameCycleService } from "../services/game-cycle.service";
import { parseShopAction } from "../parsers/shop.parser";

@Controller()
export class TestController {
  constructor(
    private readonly botService: BotService,
    private readonly gameCycle: GameCycleService,
  ) {}

  @Get()
  public async getState(): Promise<any> {
    return await this.botService.getCurrentState();
  }

  @Get("simulate/:message")
  public simulateMessage(@Param("message") message: string) {
    const m = message.replaceAll("_", " ");
    console.log("Message ", m);
    const parsedMessage: ChatAction | null = parseAllParser(m);
    if (parsedMessage) {
      console.log("Valid action", parsedMessage);
      this.gameCycle.registerChatAction(parsedMessage);
    } else {
      console.log("No valid action found");
    }
  }
}
