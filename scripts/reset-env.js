// Supprime toutes les variables d'environnement définies pour balatroce
// (configurées par setup.js / configure-env.js), et redémarre le serveur
// si besoin.

const path = require("path");
const ENV_VARS = require("./lib/env-vars");
const { removePersistentEnvVar } = require("./lib/env-persist");
const { restartServerIfRunning } = require("./lib/server-control");

const PROJECT_ROOT = path.join(__dirname, "..");

function main() {
    console.log("Suppression des variables d'environnement de balatroce...\n");

    let removedCount = 0;

    for (const varDef of ENV_VARS) {
        const existed = removePersistentEnvVar(varDef.name);
        delete process.env[varDef.name];
        if (existed) {
            console.log(`✔ ${varDef.name} supprimé.`);
            removedCount += 1;
        }
    }

    if (removedCount === 0) {
        console.log("Aucune variable n'était définie, rien à faire.");
    } else {
        console.log(`\n${removedCount} variable(s) supprimée(s).`);
    }

    restartServerIfRunning(PROJECT_ROOT);

    console.log("\nTerminé. Ouvrez un nouveau terminal pour que le nettoyage soit visible partout.");
}

main();

