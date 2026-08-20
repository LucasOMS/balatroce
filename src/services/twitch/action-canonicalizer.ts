import { ChatAction } from "../../interfaces/chat-action";
import { BotMethod } from "../../interfaces/bot-request";

/**
 * Methods for which card index order does not affect the action semantics.
 * PLAY intentionally keeps its order because played cards score from left to right.
 */
const ORDER_INDEPENDENT_METHODS = new Set<BotMethod>([
  BotMethod.DISCARD,
]);

/**
 * Builds a canonical key used to group equivalent chat actions.
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
