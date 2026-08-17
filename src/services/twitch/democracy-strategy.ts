import { VoteEntry, VoteStrategy } from "./vote-strategy.interface";

/**
 * Stratégie "démocratie" : renvoie les actions de la plus votée à la moins votée.
 */
export class DemocracyStrategy implements VoteStrategy {
  decide(entries: VoteEntry[]): VoteEntry[] {
    return [...entries].sort((a, b) => b.count - a.count);
  }
}


