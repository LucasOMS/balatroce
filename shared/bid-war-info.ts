import { BidWarKeyword } from "./bid-war-keyword";

/** Nom de l'événement WebSocket envoyé au front à chaque changement de la bid war */
export const BID_WAR_UPDATE_EVENT = "bidwar:update";

/** Informations envoyées indépendamment du reste de l'overlay pour la bid war */
export interface BidWarInfo {
  /** Montant total (score) cumulé pour chaque stratégie */
  scores: Record<BidWarKeyword, number>;
  /** Montant total tous camps confondus */
  totalAmount: number;
  /** Nombre de dons uniques comptabilisés (indépendamment du pseudo) */
  donationCount: number;
}

