// Permet de modifier interactivement les variables d'environnement du
// serveur balatroce (navigation au clavier), et redémarre le serveur si
// besoin pour appliquer le changement.

const path = require("path");
const readline = require("readline");
const ENV_VARS = require("./lib/env-vars");
const { selectFromMenu } = require("./lib/menu");
const { setPersistentEnvVar } = require("./lib/env-persist");
const { restartServerIfRunning } = require("./lib/server-control");

const PROJECT_ROOT = path.join(__dirname, "..");

function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
    }));
}

async function editVariable(varDef) {
    const current = process.env[varDef.name];
    const currentDisplay = current !== undefined && current !== "" ? current : `(non défini, défaut : ${varDef.default})`;

    console.clear();
    console.log(`=== ${varDef.name} ===\n`);
    console.log(varDef.description);
    console.log(`\nValeur actuelle : ${currentDisplay}`);

    const answer = await ask("\nNouvelle valeur (laissez vide pour annuler) : ");

    if (!answer.trim()) {
        console.log("Aucune modification effectuée.");
        return;
    }

    try {
        setPersistentEnvVar(varDef.name, answer.trim());
        process.env[varDef.name] = answer.trim();
        console.log(`✔ ${varDef.name} mis à jour.`);
    } catch (err) {
        console.error(`❌ Impossible de mettre à jour ${varDef.name} : ${err.message}`);
        return;
    }

    restartServerIfRunning(PROJECT_ROOT);
}

async function main() {
    console.log("Configuration des variables d'environnement de balatroce\n");

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const items = [
            ...ENV_VARS.map((v) => ({
                label: `${v.name}`,
                description: `${v.description} (défaut : ${v.default})`,
                value: v,
            })),
            { label: "Quitter", description: "Terminer la configuration", value: null },
        ];

        const selected = await selectFromMenu(items, "Choisissez une variable à modifier :");

        if (!selected || !selected.value) {
            console.clear();
            console.log("Terminé. Si un nouveau terminal est ouvert ailleurs, redémarrez-le pour voir les changements.");
            break;
        }

        await editVariable(selected.value);
        await ask("\nAppuyez sur Entrée pour revenir au menu...");
    }
}

main().catch((err) => {
    console.error("\n❌ Une erreur est survenue :", err && err.message ? err.message : err);
    process.exitCode = 1;
});

