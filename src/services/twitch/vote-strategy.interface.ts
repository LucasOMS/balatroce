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
 * complète des entrées de vote, de la plus préférée à la moins préférée
 * (on garde les `VoteEntry` complètes, et pas seulement les `ChatAction`,
 * pour pouvoir aussi récupérer le libellé de l'action gagnante, ex: pour
 * l'afficher sur l'overlay pendant la transition entre deux votes).
 */
export interface VoteStrategy {
  decide(entries: VoteEntry[]): VoteEntry[];
}



