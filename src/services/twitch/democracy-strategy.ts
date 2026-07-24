import { ChatAction } from "../../interfaces/chat-action";
import { VoteEntry, VoteStrategy } from "./vote-strategy.interface";

/**
 * Stratégie "démocratie" : renvoie les actions de la plus votée à la moins votée.
 */
export class DemocracyStrategy implements VoteStrategy {
  decide(entries: VoteEntry[]): ChatAction[] {
    return [...entries]
      .sort((a, b) => b.count - a.count)
      .map((entry) => entry.action);
  }
}

