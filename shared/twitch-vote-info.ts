import { VoteTimerState } from "./timer-state";

/** Nom de l'événement WebSocket envoyé au front pour les infos de vote Twitch Plays */
export const TWITCH_VOTE_UPDATE_EVENT = "twitch:vote-update";

/** Un message unifié et le nombre de votes qu'il a reçu */
export interface VoteCountEntry {
  /** Libellé du message tel qu'envoyé dans le chat (ex: "jouer 1 2 3") */
  label: string;
  /** Nombre de votes reçus pour ce message (après unification) */
  count: number;
}

/** Informations envoyées indépendamment du reste de l'overlay pour le Twitch Plays */
export interface TwitchVoteInfo {
  /** État courant du timer de vote */
  state: VoteTimerState;
  /** Timestamp (ms epoch) de fin de la phase courante, ou null si STOPPED */
  endTimestamp: number | null;
  /** Décompte des votes, du plus voté au moins voté */
  voteCounts: VoteCountEntry[];
  /**
   * Libellé de la commande gagnante du dernier vote clos (ex: "jouer 1 2 3"),
   * ou `null` si aucun vote n'a encore été clos depuis le démarrage. Utilisé
   * par l'overlay pour afficher la dernière commande utilisée pendant la
   * transition entre deux votes, à la place de "Aucun vote pour l'instant".
   */
  lastWinningLabel: string | null;
}


