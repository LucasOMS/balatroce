import { ActionKeyword } from "./action-keyword";
import { GameCycleState } from "./game-cycle-state";
import { GameState } from "./game-state";

/** Nom de l'événement WebSocket envoyé au front à chaque changement d'état */
export const OVERLAY_UPDATE_EVENT = "overlay:update";

/** Informations transmises à l'overlay Angular */
export interface OverlayInfo {
  /** Étape courante de la partie */
  step: GameCycleState;
  /** Actions disponibles pour l'étape courante */
  availableActions: ActionKeyword[];
  /** État complet du jeu (optionnel selon l'étape) */
  gameState?: GameState;
}

