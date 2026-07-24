/** État du timer de vote Twitch Plays */
export enum VoteTimerState {
  /** Le vote est en cours, les messages du chat sont comptabilisés */
  RUNNING = "RUNNING",
  /** Le vote est terminé, on attend les messages "en retard" avant la prochaine manche de vote */
  DELAY = "DELAY",
  /** Aucun vote n'est en cours */
  STOPPED = "STOPPED",
}

