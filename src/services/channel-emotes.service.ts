import { Injectable, Logger } from "@nestjs/common";
import { Subject } from "rxjs";
import { ChatEmoteMap } from "../../shared/chat-message";

interface BttvEmote {
  id: string;
  code: string;
}

interface BttvChannelResponse {
  channelEmotes?: BttvEmote[];
  sharedEmotes?: BttvEmote[];
}

interface SevenTvEmote {
  name: string;
  id: string;
}

interface SevenTvEmoteSetResponse {
  emotes?: SevenTvEmote[];
}

interface SevenTvUserResponse {
  emote_set?: SevenTvEmoteSetResponse;
}

const BTTV_GLOBAL_URL = "https://api.betterttv.net/3/cached/emotes/global";
const BTTV_CHANNEL_URL = (channelId: string) => `https://api.betterttv.net/3/cached/users/twitch/${channelId}`;
const SEVENTV_GLOBAL_URL = "https://7tv.io/v3/emote-sets/global";
const SEVENTV_CHANNEL_URL = (channelId: string) => `https://7tv.io/v3/users/twitch/${channelId}`;

/** Ré-interroge périodiquement les émotes BTTV/7TV de la chaîne, au cas où elles changeraient en cours de stream */
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Récupère et met en cache la table des émotes BTTV et 7TV (globales + spécifiques
 * à la chaîne Twitch configurée) pour permettre à l'overlay d'afficher ces émotes
 * dans le tchat, en plus des émotes Twitch natives (fournies par tmi.js).
 *
 * Ces deux API publiques ne nécessitent pas d'authentification, mais ont besoin
 * de l'identifiant Twitch numérique de la chaîne (obtenu via les tags IRC
 * `room-id`, cf. `TwitchChatService`), pas juste son nom.
 */
@Injectable()
export class ChannelEmotesService {
  private readonly logger = new Logger(ChannelEmotesService.name);

  private emoteMap: ChatEmoteMap = {};
  private channelId: string | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  private readonly updatedSubject = new Subject<void>();
  /** Émet à chaque fois que la table d'émotes a été (re)chargée */
  public readonly updated$ = this.updatedSubject.asObservable();

  /** Déclenche le chargement des émotes pour cette chaîne (une fois l'id Twitch connu) */
  public setChannelId(channelId: string): void {
    if (this.channelId === channelId) {
      return;
    }
    this.channelId = channelId;
    void this.refresh();

    if (!this.refreshTimer) {
      this.refreshTimer = setInterval(() => void this.refresh(), REFRESH_INTERVAL_MS);
    }
  }

  public stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /** Table courante code d'émote → URL d'image (BTTV + 7TV, globales + chaîne) */
  public getEmoteMap(): ChatEmoteMap {
    return this.emoteMap;
  }

  private async refresh(): Promise<void> {
    if (!this.channelId) {
      return;
    }

    const [bttv, sevenTv] = await Promise.all([
      this.fetchBttvEmotes(this.channelId),
      this.fetchSevenTvEmotes(this.channelId),
    ]);

    this.emoteMap = { ...bttv, ...sevenTv };
    this.logger.log(`Émotes BTTV/7TV rechargées : ${Object.keys(this.emoteMap).length.toString()} émote(s)`);
    this.updatedSubject.next();
  }

  private async fetchBttvEmotes(channelId: string): Promise<ChatEmoteMap> {
    const map: ChatEmoteMap = {};
    try {
      const [globalEmotes, channelResponse] = await Promise.all([
        this.fetchJson<BttvEmote[]>(BTTV_GLOBAL_URL),
        this.fetchJson<BttvChannelResponse>(BTTV_CHANNEL_URL(channelId)),
      ]);

      for (const emote of globalEmotes ?? []) {
        map[emote.code] = this.bttvImageUrl(emote.id);
      }
      for (const emote of [...(channelResponse?.channelEmotes ?? []), ...(channelResponse?.sharedEmotes ?? [])]) {
        map[emote.code] = this.bttvImageUrl(emote.id);
      }
    } catch (err) {
      this.logger.warn(`Impossible de charger les émotes BTTV : ${(err as Error).message}`);
    }
    return map;
  }

  private async fetchSevenTvEmotes(channelId: string): Promise<ChatEmoteMap> {
    const map: ChatEmoteMap = {};
    try {
      const [globalSet, userResponse] = await Promise.all([
        this.fetchJson<SevenTvEmoteSetResponse>(SEVENTV_GLOBAL_URL),
        this.fetchJson<SevenTvUserResponse>(SEVENTV_CHANNEL_URL(channelId)),
      ]);

      for (const emote of globalSet?.emotes ?? []) {
        map[emote.name] = this.sevenTvImageUrl(emote.id);
      }
      for (const emote of userResponse?.emote_set?.emotes ?? []) {
        map[emote.name] = this.sevenTvImageUrl(emote.id);
      }
    } catch (err) {
      this.logger.warn(`Impossible de charger les émotes 7TV : ${(err as Error).message}`);
    }
    return map;
  }

  private bttvImageUrl(id: string): string {
    return `https://cdn.betterttv.net/emote/${id}/2x`;
  }

  private sevenTvImageUrl(id: string): string {
    return `https://cdn.7tv.app/emote/${id}/2x.webp`;
  }

  private async fetchJson<T>(url: string): Promise<T | null> {
    const response = await fetch(url);
    if (!response.ok) {
      // 404 est normal (ex: chaîne sans émotes BTTV) : pas une erreur à logger
      if (response.status === 404) {
        return null;
      }
      throw new Error(`${url} → HTTP ${response.status.toString()}`);
    }
    return (await response.json()) as T;
  }
}

