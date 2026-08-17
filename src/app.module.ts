import { Logger, Module } from "@nestjs/common";
import { BotHttpService } from "./services/bot-http.service";
import { BotService } from "./services/bot.service";
import { TestController } from "./controller/test.controller";
import { OverlayController } from "./controller/overlay.controller";
import { AdminController } from "./controller/admin.controller";
import { GameCycleService } from "./services/game-cycle.service";
import { OverlayGateway } from "./gateways/overlay.gateway";
import { OverlayService } from "./services/overlay.service";
import { OverlaySocketService } from "./services/overlay-socket.service";
import { TwitchMessageCollectorService } from "./services/twitch-message-collector.service";
import { TwitchActionDeciderService } from "./services/twitch-action-decider.service";
import { ModeManagerService } from "./services/mode-manager.service";
import { GameWatchdogService } from "./services/game-watchdog.service";
import { AutosaveService } from "./services/autosave.service";
import { TwitchChatService } from "./services/twitch-chat.service";
import { ChannelEmotesService } from "./services/channel-emotes.service";
import { ChatGateway } from "./gateways/chat.gateway";
import { ChatSocketService } from "./services/chat-socket.service";
import { ProgressionService } from "./services/progression.service";
import { AnnouncementService } from "./services/announcement.service";
import { StatsService } from "./services/stats.service";

@Module({
  imports: [],
  controllers: [TestController, OverlayController, AdminController],
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
    ModeManagerService,
    GameWatchdogService,
    AutosaveService,
    TwitchChatService,
    ChannelEmotesService,
    ChatGateway,
    ChatSocketService,
    ProgressionService,
    AnnouncementService,
    StatsService,
  ],
  exports: [OverlaySocketService],
})
export class AppModule {}
