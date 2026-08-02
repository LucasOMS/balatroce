import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {OverlayGateway} from "../gateways/overlay.gateway";
import {OVERLAY_UPDATE_EVENT} from "../../shared/overlay-info";
import {TWITCH_VOTE_UPDATE_EVENT} from "../../shared/twitch-vote-info";
import {MODE_TIMER_UPDATE_EVENT} from "../../shared/mode-timer-info";
import {OverlayService} from "./overlay.service";
import {TwitchActionDeciderService} from "./twitch-action-decider.service";
import {ModeManagerService} from "./mode-manager.service";
import {GameWatchdogService} from "./game-watchdog.service";
import {AnnouncementService} from "./announcement.service";

/**
 * Service dédié à la communication WebSocket vers le front Angular.
 * Reçoit un OverlayInfo déjà constitué et le broadcast à tous les clients.
 * Broadcast également, indépendamment, les informations de vote Twitch Plays
 * (état du timer, sa fin, le nombre de votes actuel) ainsi que le minuteur de
 * mode (mode actuel, fin de phase, montant de la phase et total de dons).
 */
@Injectable()
export class OverlaySocketService implements OnModuleInit {
    private readonly logger = new Logger(OverlaySocketService.name);

    constructor(private readonly gateway: OverlayGateway,
                private readonly overlayService: OverlayService,
                private readonly twitchActionDecider: TwitchActionDeciderService,
                private readonly modeManagerService: ModeManagerService,
                private readonly gameWatchdogService: GameWatchdogService,
                private readonly announcementService: AnnouncementService) {
    }

    public onModuleInit(): void {
        this.twitchActionDecider.voteInfoChanged$.subscribe(() => {
            this.broadcastVoteUpdate();
        });
        this.modeManagerService.modeChanged$.subscribe(() => {
            this.broadcastModeUpdate();
        });
        this.gameWatchdogService.restarting$.subscribe(() => {
            void this.update();
        });
        this.announcementService.message$.subscribe(() => {
            void this.update();
        });
    }

    async update(): Promise<void> {
        try {
            console.log('Send overlay update to clients');
            this.gateway.server.emit(OVERLAY_UPDATE_EVENT, await this.overlayService.getCurrentInfo());
        } catch (err) {
            this.logger.warn(
                `Impossible d'envoyer la mise à jour de l'overlay : ${(err as Error).message}`,
            );
        }
    }

    broadcastVoteUpdate(): void {
        this.gateway.server.emit(TWITCH_VOTE_UPDATE_EVENT, this.twitchActionDecider.getCurrentVoteInfo());
    }

    broadcastModeUpdate(): void {
        this.gateway.server.emit(MODE_TIMER_UPDATE_EVENT, this.modeManagerService.getCurrentInfo());
    }
}


