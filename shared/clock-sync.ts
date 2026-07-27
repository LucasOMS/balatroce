/**
 * Nom de l'événement WebSocket utilisé pour synchroniser l'horloge du client
 * avec celle du serveur (façon NTP) : le client envoie son propre timestamp,
 * le serveur répond (accusé de réception) avec le sien.
 */
export const CLOCK_SYNC_EVENT = "clock:sync";

/** Payload envoyé par le client : son timestamp au moment de l'envoi. */
export interface ClockSyncRequest {
  clientSentAt: number;
}

/** Payload renvoyé par le serveur (via l'accusé de réception socket.io). */
export interface ClockSyncResponse {
  clientSentAt: number;
  serverTime: number;
}

