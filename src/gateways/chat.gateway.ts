import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { CHAT_EMOTES_EVENT, CHAT_HISTORY_EVENT } from "../../shared/chat-message";
import { TwitchChatService } from "../services/twitch-chat.service";
import { ChannelEmotesService } from "../services/channel-emotes.service";

/**
 * Namespace WebSocket dédié au tchat Twitch de l'overlay, séparé du gateway
 * principal (`OverlayGateway`) pour isoler ce flux à haute fréquence des
 * autres mises à jour de l'overlay.
 */
@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: "*",
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly twitchChatService: TwitchChatService,
    private readonly channelEmotesService: ChannelEmotesService,
  ) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Client tchat connecté : ${client.id}`);
    client.emit(CHAT_HISTORY_EVENT, this.twitchChatService.getHistory());
    client.emit(CHAT_EMOTES_EVENT, this.channelEmotesService.getEmoteMap());
  }
}

