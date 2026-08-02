/**
 * Mode de sélection des actions à partir des votes du chat Twitch : soit la
 * démocratie (l'action la plus votée gagne), soit l'anarchie (tirage au sort
 * pondéré par les votes). Le mode change automatiquement au bout d'un certain
 * temps, ou immédiatement si un montant de dons suffisant est atteint (voir
 * ModeManagerService).
 */
export enum ActionMode {
  Democracy = "democratie",
  Anarchy = "anarchie",
}

