/** Nom de l'événement WebSocket envoyé au front à chaque nouveau message de tchat */
export const CHAT_MESSAGE_EVENT = "chat:message";

/** Nom de l'événement WebSocket envoyé au front à la connexion, avec l'historique des derniers messages */
export const CHAT_HISTORY_EVENT = "chat:history";

/** Nom de l'événement WebSocket envoyé au front à chaque (re)chargement des émotes BTTV/7TV de la chaîne */
export const CHAT_EMOTES_EVENT = "chat:emotes";

/** Position d'une émote Twitch native dans le texte brut du message (index de caractères, `end` inclus) */
export interface TwitchEmotePosition {
  id: string;
  start: number;
  end: number;
}

/** Un message de tchat Twitch, prêt à être affiché sur l'overlay */
export interface ChatMessage {
  /** Identifiant unique du message (id Twitch si disponible, sinon généré) */
  id: string;
  /** Pseudo affiché de l'auteur */
  username: string;
  /** Texte brut du message */
  message: string;
  /** Positions des émotes Twitch natives dans `message` (BTTV/7TV sont résolues côté front via la table d'émotes) */
  emotes: TwitchEmotePosition[];
  /** Timestamp (ms, epoch) de réception du message */
  timestamp: number;
}

/** Table d'émotes BTTV/7TV (globales + de la chaîne) : code de l'émote → URL de l'image */
export type ChatEmoteMap = Record<string, string>;

