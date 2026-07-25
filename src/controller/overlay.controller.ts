import { Controller, Get } from "@nestjs/common";
import { OverlayService } from "../services/overlay.service";
import { OverlayInfo } from "../../shared/overlay-info";
import { TwitchActionDeciderService } from "../services/twitch-action-decider.service";
import type { TwitchVoteInfo } from "../../shared/twitch-vote-info";
import type { BidWarInfo } from "../../shared/bid-war-info";
import { StreamlabsDonationCollecterService } from "../services/streamlabs-donation-collecter.service";

@Controller("overlay")
export class OverlayController {
  constructor(
    private readonly overlayService: OverlayService,
    private readonly twitchActionDecider: TwitchActionDeciderService,
    private readonly bidWarService: StreamlabsDonationCollecterService,
  ) {}

  /** Retourne l'état overlay courant en interrogeant le bot */
  @Get("state")
  async getState(): Promise<OverlayInfo> {
    return this.overlayService.getCurrentInfo();
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




