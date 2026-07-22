import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { OVERLAY_UPDATE_EVENT } from "../../shared/overlay-info";
import { OverlayService } from "../services/overlay.service";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class OverlayGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OverlayGateway.name);

  constructor(private readonly overlayService: OverlayService) {}

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
}

