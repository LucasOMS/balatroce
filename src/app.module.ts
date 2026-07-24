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
import { TwitchAuthService } from "./services/twitch-auth.service";
import { TwitchAuthController } from "./controller/twitch-auth.controller";

@Module({
  imports: [],
  controllers: [TestController, OverlayController, TwitchAuthController],
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
    TwitchAuthService,
  ],
  exports: [OverlaySocketService],
})
export class AppModule {}
