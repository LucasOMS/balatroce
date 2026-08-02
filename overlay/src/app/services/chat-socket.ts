import {Injectable, Signal, signal} from "@angular/core";
import {io, Socket} from "socket.io-client";
import {
  CHAT_EMOTES_EVENT,
  CHAT_HISTORY_EVENT,
  CHAT_MESSAGE_EVENT,
  ChatEmoteMap,
  ChatMessage,
} from "@shared/chat-message";

const SERVER_URL = "http://localhost:3000";
/** Nombre maximum de messages conservés côté front (le plus récent en dernier) */
const MAX_MESSAGES = 30;

/**
 * Un message de tchat tel que gardé côté front, avec un indicateur pour ne
 * jouer l'animation d'apparition que sur les messages reçus en temps réel
 * (pas ceux de l'historique initial reçu à la connexion).
 */
export interface DisplayChatMessage extends ChatMessage {
  animate: boolean;
}

/**
 * Service dédié à la connexion WebSocket du tchat Twitch de l'overlay
 * (namespace `/chat`, séparé du reste de l'overlay pour isoler ce flux à
 * haute fréquence). Toujours connecté à la chaîne Twitch réellement
 * configurée côté serveur (`TWITCH_CHANNEL`) : jamais de données mockées.
 */
@Injectable({providedIn: "root"})
export class ChatSocket {
  private readonly socket: Socket;

  private readonly messagesSignal = signal<DisplayChatMessage[]>([]);
  /** Derniers messages de tchat (le plus récent en dernier), jusqu'à 30 */
  readonly messages: Signal<DisplayChatMessage[]> = this.messagesSignal.asReadonly();

  private readonly emotesSignal = signal<ChatEmoteMap>({});
  /** Table des émotes BTTV/7TV de la chaîne (code → URL de l'image) */
  readonly emotes: Signal<ChatEmoteMap> = this.emotesSignal.asReadonly();

  constructor() {
    this.socket = io(`${SERVER_URL}/chat`, {transports: ["websocket"]});

    this.socket.on(CHAT_HISTORY_EVENT, (history: ChatMessage[]) => {
      this.messagesSignal.set(history.map((message) => ({...message, animate: false})));
    });

    this.socket.on(CHAT_MESSAGE_EVENT, (message: ChatMessage) => {
      this.messagesSignal.update((current) => {
        const next = [...current, {...message, animate: true}];
        return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
      });
    });

    this.socket.on(CHAT_EMOTES_EVENT, (emotes: ChatEmoteMap) => {
      this.emotesSignal.set(emotes);
    });
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}

