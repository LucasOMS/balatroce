import {PerformedAction, PerformedActionType} from "../../../shared/performed-action";
import {ChatAction} from "../../interfaces/chat-action";
import {BotMethod} from "../../interfaces/bot-request";
import {GameState} from "../../interfaces/game-state";

/**
 * Builds the semantic description of an action from the game state that existed
 * immediately before the action was executed.
 */
export function resolvePerformedAction(
  action: ChatAction,
  _previousState: GameState,
): PerformedAction | null {
  switch (action.method) {
    case BotMethod.SELECT:
      return {type: PerformedActionType.SELECT_BLIND};
    case BotMethod.SKIP:
      return {type: PerformedActionType.SKIP_BLIND};
    case BotMethod.REROLL:
      return {type: PerformedActionType.REROLL};
    case BotMethod.NEXT_ROUND:
      return {type: PerformedActionType.NEXT_ROUND};
    case BotMethod.START:
      return {type: PerformedActionType.START_RUN};
    case BotMethod.PACK:
      return "skip" in action.params
        ? {type: PerformedActionType.PACK_SKIP}
        : null;
    default:
      return null;
  }
}
