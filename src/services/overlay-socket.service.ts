import {Injectable} from "@nestjs/common";
import {OverlayGateway} from "../gateways/overlay.gateway";
import {OVERLAY_UPDATE_EVENT} from "../../shared/overlay-info";
import {OverlayService} from "./overlay.service";

/**
 * Service dédié à la communication WebSocket vers le front Angular.
 * Reçoit un OverlayInfo déjà constitué et le broadcast à tous les clients.
 */
@Injectable()
export class OverlaySocketService {
    constructor(private readonly gateway: OverlayGateway,
                private readonly overlayService: OverlayService) {
    }

    async update(): Promise<void> {
        console.log('Send overlay update to clients');
        this.gateway.server.emit(OVERLAY_UPDATE_EVENT, await this.overlayService.getCurrentInfo());
    }
}
