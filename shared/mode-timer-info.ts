import { ActionMode } from "./action-mode";

/** Nom de l'événement WebSocket envoyé au front à chaque changement du minuteur de mode */
export const MODE_TIMER_UPDATE_EVENT = "mode-timer:update";

/** Informations envoyées indépendamment du reste de l'overlay pour le minuteur de mode */
export interface ModeTimerInfo {
  /** Mode actuellement actif (démocratie ou anarchie) */
  mode: ActionMode;
  /** Timestamp (ms, epoch) auquel le mode changera automatiquement si rien ne se passe avant */
  phaseEndTimestamp: number;
  /** Durée totale (ms) d'une phase, utilisée par le front pour calculer la progression du chrono */
  phaseDurationMs: number;
  /** Montant de dons cumulé depuis le dernier changement de mode */
  donationAmount: number;
  /** Montant de dons à atteindre pour déclencher un changement de mode immédiat */
  donationThreshold: number;
  /** Montant total de dons récoltés depuis le début (statistique globale, jamais réinitialisée) */
  totalDonationAmount: number;
}


