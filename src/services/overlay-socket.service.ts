import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {OverlayGateway} from "../gateways/overlay.gateway";
import {OVERLAY_UPDATE_EVENT} from "../../shared/overlay-info";
import {TWITCH_VOTE_UPDATE_EVENT} from "../../shared/twitch-vote-info";
import {OverlayService} from "./overlay.service";
import {TwitchActionDeciderService} from "./twitch-action-decider.service";

/**
 * Service dédié à la communication WebSocket vers le front Angular.
 * Reçoit un OverlayInfo déjà constitué et le broadcast à tous les clients.
 * Broadcast également, indépendamment, les informations de vote Twitch Plays
 * (état du timer, sa fin, le nombre de votes actuel).
 */
@Injectable()
export class OverlaySocketService implements OnModuleInit {
    private readonly logger = new Logger(OverlaySocketService.name);

    constructor(private readonly gateway: OverlayGateway,
                private readonly overlayService: OverlayService,
                private readonly twitchActionDecider: TwitchActionDeciderService) {
    }

    public onModuleInit(): void {
        this.twitchActionDecider.voteInfoChanged$.subscribe(() => {
            this.broadcastVoteUpdate();
        });
    }

    async update(): Promise<void> {
        console.log('Send overlay update to clients');
        this.gateway.server.emit(OVERLAY_UPDATE_EVENT, await this.overlayService.getCurrentInfo());
    }

    broadcastVoteUpdate(): void {
        this.gateway.server.emit(TWITCH_VOTE_UPDATE_EVENT, this.twitchActionDecider.getCurrentVoteInfo());
    }
}

