// Petit utilitaire pour définir une variable d'environnement Windows de
// façon persistante (utilisateur courant), sans nécessiter les droits admin.

const { execSync } = require("child_process");

/**
 * Définit une variable d'environnement utilisateur persistante via `setx`.
 * Ne met à jour que le registre : le process Node courant doit aussi mettre
 * à jour `process.env` lui-même si besoin d'un effet immédiat.
 */
function setPersistentEnvVar(name, value) {
    // /* setx échoue si la valeur contient certains caractères non échappés,
    //    on encapsule donc systématiquement la valeur entre guillemets. */
    execSync(`setx ${name} "${value}"`, { stdio: "ignore" });
}

/**
 * Supprime une variable d'environnement utilisateur persistante (registre).
 * Ne fait rien (sans erreur) si la variable n'existe pas.
 */
function removePersistentEnvVar(name) {
    try {
        execSync(`reg delete "HKCU\\Environment" /F /V ${name}`, { stdio: "ignore" });
        return true;
    } catch {
        // La variable n'existait probablement pas : ce n'est pas une erreur.
        return false;
    }
}

module.exports = { setPersistentEnvVar, removePersistentEnvVar };

