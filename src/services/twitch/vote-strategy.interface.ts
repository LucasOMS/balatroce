import { ChatAction } from "../../interfaces/chat-action";

/** Une entrée de vote unifiée : une action, son libellé d'origine et son nombre de votes */
export interface VoteEntry {
  key: string;
  action: ChatAction;
  label: string;
  count: number;
}

/**
 * Stratégie de décision : à partir du décompte des votes, renvoie la liste
 * complète des actions, de la plus préférée à la moins préférée.
 */
export interface VoteStrategy {
  decide(entries: VoteEntry[]): ChatAction[];
}

