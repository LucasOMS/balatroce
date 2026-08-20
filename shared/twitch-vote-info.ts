import { PerformedAction } from "./performed-action";
import { VoteTimerState } from "./timer-state";

/** WebSocket event name sent to the overlay for Twitch Plays vote information. */
export const TWITCH_VOTE_UPDATE_EVENT = "twitch:vote-update";

/** A canonicalized message and the number of votes it received. */
export interface VoteCountEntry {
  /** Label as sent in chat, kept only for the live vote aggregation. */
  label: string;
  /** Number of votes received for this canonical action. */
  count: number;
}

/** Vote information sent independently from the rest of the overlay state. */
export interface TwitchVoteInfo {
  state: VoteTimerState;
  endTimestamp: number | null;
  voteCounts: VoteCountEntry[];
  /**
   * Semantic snapshot of the action selected for execution during the previous
   * game state. The overlay is responsible for turning it into localized text.
   */
  lastPerformedAction: PerformedAction | null;
}
