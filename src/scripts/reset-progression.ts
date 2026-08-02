import { deleteProgressionFile } from "../services/progression.service";
import { PROGRESSION_STATE_PATH } from "../config/progression.config";

/**
 * Script CLI pour réinitialiser la progression de la boucle de jeu
 * (deck/difficulté). Utilisé via `npm run reset-progression`.
 */
deleteProgressionFile();
console.log(`Progression réinitialisée (fichier supprimé : ${PROGRESSION_STATE_PATH}).`);
console.log("Le prochain lancement repartira du premier deck en première difficulté.");

