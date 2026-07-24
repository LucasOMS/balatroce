import { ChatAction } from "../../interfaces/chat-action";
import { BotMethod } from "../../interfaces/bot-request";

/**
 * Méthodes pour lesquelles l'ordre des index de cartes n'a pas d'importance
 * (jouer/défausser un set de cartes est équivalent quel que soit l'ordre).
 * Pour REARRANGE, l'ordre est justement le sens de l'action : on ne le trie pas.
 */
const ORDER_INDEPENDENT_METHODS = new Set<BotMethod>([
  BotMethod.PLAY,
  BotMethod.DISCARD,
]);

/**
 * Construit une clé canonique pour une action, permettant de regrouper
 * des messages équivalents (ex: "jouer 2 1 3" === "jouer 1 2 3").
 */
export function canonicalizeAction(action: ChatAction): {
  key: string;
  canonicalAction: ChatAction;
} {
  const params = (action as { params?: Record<string, unknown> }).params;
  let canonicalParams = params;

  if (params && ORDER_INDEPENDENT_METHODS.has(action.method) && Array.isArray(params.cards)) {
    canonicalParams = {
      ...params,
      cards: [...(params.cards as number[])].sort((a, b) => a - b),
    };
  }

  const canonicalAction = { ...action, params: canonicalParams } as ChatAction;
  const key = `${action.method}:${JSON.stringify(canonicalParams ?? null)}`;

  return { key, canonicalAction };
}

