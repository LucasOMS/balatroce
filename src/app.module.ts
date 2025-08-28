import { Logger, Module } from "@nestjs/common";
import { BotSocketService } from "./services/bot-socket.service";
import { BotService } from "./services/bot.service";
import { TestController } from "./controller/test.controller";
import { GameCycleService } from "./services/game-cycle.service";

@Module({
  imports: [],
  controllers: [TestController],
  providers: [Logger, BotSocketService, GameCycleService, BotService],
})
export class AppModule {}
