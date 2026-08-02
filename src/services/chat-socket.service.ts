import { Injectable, OnModuleInit } from "@nestjs/common";
import { ChatGateway } from "../gateways/chat.gateway";
import { CHAT_EMOTES_EVENT, CHAT_MESSAGE_EVENT } from "../../shared/chat-message";
import { TwitchChatService } from "./twitch-chat.service";
import { ChannelEmotesService } from "./channel-emotes.service";

/**
 * Broadcast, vers le namespace WebSocket dédié au tchat, chaque nouveau
 * message reçu du chat Twitch ainsi que les mises à jour de la table
 * d'émotes BTTV/7TV de la chaîne.
 */
@Injectable()
export class ChatSocketService implements OnModuleInit {
  constructor(
    private readonly gateway: ChatGateway,
    private readonly twitchChatService: TwitchChatService,
    private readonly channelEmotesService: ChannelEmotesService,
  ) {}

  public onModuleInit(): void {
    this.twitchChatService.newMessage$.subscribe((message) => {
      this.gateway.server.emit(CHAT_MESSAGE_EVENT, message);
    });

    this.channelEmotesService.updated$.subscribe(() => {
      this.gateway.server.emit(CHAT_EMOTES_EVENT, this.channelEmotesService.getEmoteMap());
    });
  }
}

