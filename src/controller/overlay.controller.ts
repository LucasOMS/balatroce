import { Controller, Get, Logger } from "@nestjs/common";
import { OverlayService } from "../services/overlay.service";
import { OverlayInfo } from "../../shared/overlay-info";
import { TwitchActionDeciderService } from "../services/twitch-action-decider.service";
import type { TwitchVoteInfo } from "../../shared/twitch-vote-info";
import type { BidWarInfo } from "../../shared/bid-war-info";
import { StreamlabsDonationCollecterService } from "../services/streamlabs-donation-collecter.service";
import { GameWatchdogService } from "../services/game-watchdog.service";

@Controller("overlay")
export class OverlayController {
  private readonly logger = new Logger(OverlayController.name);

  constructor(
    private readonly overlayService: OverlayService,
    private readonly twitchActionDecider: TwitchActionDeciderService,
    private readonly bidWarService: StreamlabsDonationCollecterService,
    private readonly gameWatchdogService: GameWatchdogService,
  ) {}

  /** Retourne l'état overlay courant en interrogeant le bot */
  @Get("state")
  async getState(): Promise<OverlayInfo> {
    try {
      return await this.overlayService.getCurrentInfo();
    } catch (err) {
      this.logger.warn(
        `Impossible de récupérer l'état du jeu : ${(err as Error).message}`,
      );
      return {
        availableActions: [],
        restarting: this.gameWatchdogService.isRestarting(),
        restartMessage: GameWatchdogService.RESTART_MESSAGE,
      };
    }
  }

  /** Retourne l'état courant du vote Twitch Plays (état du timer + décompte des votes) */
  @Get("twitch-vote-state")
  getTwitchVoteState(): TwitchVoteInfo {
    return this.twitchActionDecider.getCurrentVoteInfo();
  }

  /** Retourne l'état courant de la bid war (score de chaque stratégie, montant total, nombre de dons) */
  @Get("bid-war-state")
  getBidWarState(): BidWarInfo {
    return this.bidWarService.getCurrentInfo();
  }
}





