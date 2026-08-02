import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Subject } from "rxjs";
import * as tmi from "tmi.js";
import { isActionMessage } from "../parsers/parse-all.parser";
import { ChatMessage, TwitchEmotePosition } from "../../shared/chat-message";
import { ChannelEmotesService } from "./channel-emotes.service";

/** Nombre maximum de messages conservés en mémoire (et envoyés à un nouveau client) */
const MAX_HISTORY = 30;

/**
 * Se connecte anonymement en lecture seule au chat Twitch pour alimenter le
 * tchat affiché sur l'overlay (distinct de `TwitchMessageCollectorService`,
 * qui ne garde qu'un message par utilisateur pour les votes d'actions).
 *
 * Tous les messages sont conservés (jusqu'à `MAX_HISTORY`, le plus récent en
 * dernier), sauf ceux qui sont des commandes de jeu (un ActionKeyword suivi
 * d'un espace), qui ne doivent pas polluer l'affichage du tchat.
 *
 * Variables d'environnement :
 * - TWITCH_MOCK : si "true", ne se connecte pas réellement à Twitch (utile en dev/tests)
 * - TWITCH_CHANNEL : nom de la chaîne Twitch à écouter (sans le #)
 */
@Injectable()
export class TwitchChatService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TwitchChatService.name);
  private client: tmi.Client | null = null;

  /** Historique des derniers messages, le plus récent en dernier */
  private readonly history: ChatMessage[] = [];

  private readonly messageSubject = new Subject<ChatMessage>();
  /** Émet à chaque nouveau message de tchat (hors commandes de jeu) */
  public readonly newMessage$ = this.messageSubject.asObservable();

  constructor(private readonly channelEmotesService: ChannelEmotesService) {}

  public async onModuleInit(): Promise<void> {
    if (process.env.TWITCH_MOCK === "true") {
      this.logger.warn(
        "TWITCH_MOCK=true : tchat overlay désactivé. Utilisez /debug/twitch/:user/:message pour simuler des messages.",
      );
      return;
    }

    const channel = process.env.TWITCH_CHANNEL;
    if (!channel) {
      throw new Error("TWITCH_CHANNEL non défini : impossible de se connecter au chat Twitch (overlay).");
    }

    this.setupClient(channel);
    await this.connect();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.client?.disconnect();
    this.channelEmotesService.stop();
  }

  private setupClient(channel: string): void {
    this.client = new tmi.Client({
      options: { debug: false },
      connection: {
        reconnect: true,
        secure: true,
        reconnectDecay: 1.5,
        reconnectInterval: 1000,
        maxReconnectInterval: 30000,
        maxReconnectAttempts: Infinity,
      },
      channels: [channel],
    });

    this.client.on("message", (_channel, tags, message, self) => {
      if (self) {
        return;
      }
      const username = tags["display-name"] ?? tags.username ?? "unknown";
      this.registerMessage(username, message, tags);
    });

    this.client.on("roomstate", (_channel, state) => {
      const roomId = state["room-id"];
      if (roomId) {
        this.channelEmotesService.setChannelId(roomId);
      }
    });

    this.client.on("connected", (address, port) => {
      this.logger.log(`[Tchat overlay] Connecté au chat Twitch #${channel} (${address}:${port.toString()}, anonyme)`);
    });

    this.client.on("disconnected", (reason) => {
      this.logger.warn(`[Tchat overlay] Déconnecté du chat Twitch : ${reason || "raison inconnue"}. Reconnexion automatique...`);
    });

    this.client.on("reconnect", () => {
      this.logger.log("[Tchat overlay] Tentative de reconnexion au chat Twitch...");
    });

    this.client.on("notice", (_channel, msgid, message) => {
      this.logger.warn(`[Tchat overlay] Notice Twitch (${msgid ?? "?"}) : ${message}`);
    });
  }

  private async connect(): Promise<void> {
    if (!this.client) {
      return;
    }

    while (true) {
      try {
        await this.client.connect();
        return;
      } catch (err) {
        this.logger.error(
          `[Tchat overlay] Impossible de se connecter au chat Twitch : ${(err as Error).message}. Nouvelle tentative dans 5s...`,
        );
        await new Promise<void>((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Enregistre un message reçu, sauf s'il s'agit d'une commande de jeu
   * (ActionKeyword). Exposé publiquement pour être utilisé aussi bien par la
   * connexion Twitch réelle que par un éventuel mock de test.
   */
  public registerMessage(username: string, rawMessage: string, tags?: tmi.ChatUserstate): void {
    const trimmed = rawMessage.trim();

    if (isActionMessage(trimmed)) {
      return;
    }

    const chatMessage: ChatMessage = {
      id: tags?.id ?? randomUUID(),
      username,
      message: trimmed,
      emotes: this.extractEmotes(tags?.emotes),
      timestamp: Date.now(),
    };

    this.history.push(chatMessage);
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
    this.messageSubject.next(chatMessage);
  }

  private extractEmotes(emotes?: Record<string, string[]>): TwitchEmotePosition[] {
    if (!emotes) {
      return [];
    }

    const positions: TwitchEmotePosition[] = [];
    for (const [id, ranges] of Object.entries(emotes)) {
      for (const range of ranges) {
        const [start, end] = range.split("-").map((v) => parseInt(v, 10));
        if (!Number.isNaN(start) && !Number.isNaN(end)) {
          positions.push({ id, start, end });
        }
      }
    }
    return positions.sort((a, b) => a.start - b.start);
  }

  /** Historique des derniers messages (le plus récent en dernier), pour les nouveaux clients WebSocket */
  public getHistory(): ChatMessage[] {
    return [...this.history];
  }
}

