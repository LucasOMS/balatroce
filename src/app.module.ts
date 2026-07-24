import { Logger, Module } from "@nestjs/common";
import { BotHttpService } from "./services/bot-http.service";
import { BotService } from "./services/bot.service";
import { TestController } from "./controller/test.controller";
import { OverlayController } from "./controller/overlay.controller";
import { GameCycleService } from "./services/game-cycle.service";
import { OverlayGateway } from "./gateways/overlay.gateway";
import { OverlayService } from "./services/overlay.service";
import { OverlaySocketService } from "./services/overlay-socket.service";
import { TwitchMessageCollectorService } from "./services/twitch-message-collector.service";
import { TwitchActionDeciderService } from "./services/twitch-action-decider.service";

@Module({
  imports: [],
  controllers: [TestController, OverlayController],
  providers: [
    Logger,
    BotHttpService,
    GameCycleService,
    BotService,
    OverlayGateway,
    OverlayService,
    OverlaySocketService,
    TwitchMessageCollectorService,
    TwitchActionDeciderService,
  ],
  exports: [OverlaySocketService],
})
export class AppModule {}
