import {MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer} from "@nestjs/websockets";
import {Logger} from "@nestjs/common";
import {Server, Socket} from "socket.io";
import {OVERLAY_UPDATE_EVENT} from "../../shared/overlay-info";
import {CLOCK_SYNC_EVENT} from "../../shared/clock-sync";
import type {ClockSyncRequest, ClockSyncResponse} from "../../shared/clock-sync";
import {OverlayService} from "../services/overlay.service";

@WebSocketGateway({
    cors: {
        origin: "*",
    },
})
export class OverlayGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(OverlayGateway.name);

    constructor(private readonly overlayService: OverlayService) {
    }

    async handleConnection(client: Socket): Promise<void> {
        this.logger.log(`Overlay client connected: ${client.id}`);
        try {
            const info = await this.overlayService.getCurrentInfo();
            client.emit(OVERLAY_UPDATE_EVENT, info);
        } catch (err) {
            this.logger.warn(
                `Could not fetch game state for client ${client.id}: ${(err as Error).message}`,
            );
        }
    }

    handleDisconnect(client: Socket): void {
        this.logger.log(`Overlay client disconnected: ${client.id}`);
    }

    /**
     * Synchronisation d'horloge client/serveur (façon NTP) : le client envoie
     * son timestamp d'émission, on répond avec notre heure serveur. Le client
     * peut alors estimer le décalage entre les deux horloges et l'appliquer
     * aux timestamps absolus (ex: `endTimestamp`) qu'on lui envoie par
     * ailleurs, pour éviter tout décalage dû à une dérive d'horloge.
     */
    @SubscribeMessage(CLOCK_SYNC_EVENT)
    handleClockSync(@MessageBody() request: ClockSyncRequest): ClockSyncResponse {
        return {clientSentAt: request.clientSentAt, serverTime: Date.now()};
    }
}

