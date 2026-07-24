import { ChatAction } from "../../interfaces/chat-action";
import { VoteEntry, VoteStrategy } from "./vote-strategy.interface";

/**
 * Stratégie "anarchie" : tire au sort une action avec une probabilité pondérée
 * par le nombre de votes de chaque action (plus une action a été votée, plus
 * elle a de chances de sortir en premier). On tire au sort jusqu'à ce que
 * toutes les actions aient été tirées.
 */
export class AnarchyStrategy implements VoteStrategy {
  decide(entries: VoteEntry[]): ChatAction[] {
    const pool = entries.filter((entry) => entry.count > 0).map((entry) => ({ ...entry }));
    const result: ChatAction[] = [];

    while (pool.length > 0) {
      const totalWeight = pool.reduce((sum, entry) => sum + entry.count, 0);
      let roll = Math.random() * totalWeight;

      let chosenIndex = pool.length - 1;
      for (let i = 0; i < pool.length; i++) {
        roll -= pool[i].count;
        if (roll <= 0) {
          chosenIndex = i;
          break;
        }
      }

      result.push(pool[chosenIndex].action);
      pool.splice(chosenIndex, 1);
    }

    return result;
  }
}

