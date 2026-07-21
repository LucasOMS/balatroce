import { Logger, Module } from "@nestjs/common";
import { BotHttpService } from "./services/bot-http.service";
import { BotService } from "./services/bot.service";
import { TestController } from "./controller/test.controller";
import { GameCycleService } from "./services/game-cycle.service";

@Module({
  imports: [],
  controllers: [TestController],
  providers: [Logger, BotHttpService, GameCycleService, BotService],
})
export class AppModule {}
