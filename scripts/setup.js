// Script d'installation de balatroce, lancé par scripts/setup.bat une fois
// que Node.js est disponible. Pensé pour être robuste : chaque étape prévient
// clairement l'utilisateur en cas de problème plutôt que de planter.

const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { execSync } = require("child_process");
const { setPersistentEnvVar } = require("./lib/env-persist");

const PROJECT_ROOT = path.join(__dirname, "..");
const OVERLAY_ROOT = path.join(PROJECT_ROOT, "overlay");
const MODS_SOURCE = path.join(PROJECT_ROOT, "ressources", "Mods");
const BALATRO_APPDATA = path.join(process.env.APPDATA || "", "Balatro");

function log(msg) {
    console.log(msg);
}

function step(title) {
    console.log(`\n=== ${title} ===`);
}

function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
    }));
}

function run(command) {
    execSync(command, { cwd: PROJECT_ROOT, stdio: "inherit" });
}

function runIn(cwd, command) {
    execSync(command, { cwd, stdio: "inherit" });
}

/** Copie récursivement un dossier, en fusionnant avec le contenu existant. */
function copyRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(src, dest, { recursive: true, force: true });
}

async function installDependenciesAndBuild() {
    step("Installation des dépendances (npm install)");
    try {
        run("npm install");
    } catch (err) {
        console.error("❌ 'npm install' a échoué. Vérifiez votre connexion internet puis relancez le script.");
        throw err;
    }

    step("Compilation du projet (npm run build)");
    try {
        run("npm run build");
    } catch (err) {
        console.error("❌ 'npm run build' a échoué. Voir les messages ci-dessus pour comprendre pourquoi.");
        throw err;
    }

    if (fs.existsSync(OVERLAY_ROOT)) {
        step("Installation des dépendances de l'overlay (overlay/npm install)");
        try {
            runIn(OVERLAY_ROOT, "npm install");
        } catch (err) {
            console.warn(`⚠️  Installation des dépendances de l'overlay échouée : ${err.message}`);
            console.warn("   L'overlay pourra être réinstallé plus tard avec : cd overlay && npm install");
        }
    } else {
        console.warn(`⚠️  Dossier ${OVERLAY_ROOT} introuvable, installation de l'overlay ignorée.`);
    }
}

async function setupEnvironmentVariables() {
    step("Configuration des variables d'environnement");

    const fixedVars = {
        TWITCH_CHANNEL: "angledroit",
        MODE_PHASE_DURATION_MS: "60000",
        MODE_DONATION_THRESHOLD: "500",
        TWITCH_VOTE_DURATION_MS: "20000",
        TWITCH_VOTE_DELAY_MS: "5000",
    };

    for (const [name, value] of Object.entries(fixedVars)) {
        try {
            setPersistentEnvVar(name, value);
            log(`✔ ${name}=${value}`);
        } catch (err) {
            console.warn(`⚠️  Impossible de définir ${name} automatiquement : ${err.message}`);
            console.warn(`   Vous pourrez la définir plus tard avec scripts/configure-env.bat`);
        }
    }

    const token = await ask(
        "\nEntrez votre jeton Streamlabs (STREAMLABS_SOCKET_TOKEN, disponible sur https://streamlabs.com/dashboard#/settings/api-settings)." +
            "\nLaissez vide pour le configurer plus tard avec scripts/configure-env.bat : ",
    );

    if (token.trim()) {
        try {
            setPersistentEnvVar("STREAMLABS_SOCKET_TOKEN", token.trim());
            log("✔ STREAMLABS_SOCKET_TOKEN enregistré.");
        } catch (err) {
            console.warn(`⚠️  Impossible d'enregistrer le jeton automatiquement : ${err.message}`);
        }
    } else {
        console.warn(
            "⚠️  Aucun jeton Streamlabs renseigné : le serveur refusera de démarrer tant que " +
                "STREAMLABS_SOCKET_TOKEN n'est pas défini (sauf si STREAMLABS_MOCK=true).",
        );
    }
}

async function ensureBalatroInstalled() {
    step("Vérification de l'installation de Balatro");

    if (fs.existsSync(BALATRO_APPDATA)) {
        log(`✔ Dossier Balatro trouvé : ${BALATRO_APPDATA}`);
        return;
    }

    console.log(`\n⚠️  Le dossier ${BALATRO_APPDATA} est introuvable.`);
    console.log("Merci d'installer et de lancer Balatro au moins une fois avant de continuer :");
    console.log("  - Achetez/installez Balatro sur Steam : https://store.steampowered.com/app/2379780/Balatro/");
    console.log("  - Lancez le jeu une première fois, puis fermez-le");
    await ask("\nAppuyez sur Entrée une fois que c'est fait pour continuer...");

    if (!fs.existsSync(BALATRO_APPDATA)) {
        console.warn(
            `⚠️  Le dossier ${BALATRO_APPDATA} est toujours introuvable. La suite de l'installation ` +
                "(copie des mods) risque d'échouer. Vous pourrez relancer ce script plus tard.",
        );
    }
}

async function copyMods() {
    step("Installation des mods dans Balatro");

    if (!fs.existsSync(MODS_SOURCE)) {
        console.warn(`⚠️  Dossier ${MODS_SOURCE} introuvable, cette étape est ignorée.`);
        return;
    }

    try {
        fs.mkdirSync(BALATRO_APPDATA, { recursive: true });
        copyRecursive(MODS_SOURCE, BALATRO_APPDATA);
        log(`✔ Mods copiés dans ${BALATRO_APPDATA}`);
    } catch (err) {
        console.warn(`⚠️  Impossible de copier les mods automatiquement : ${err.message}`);
        console.warn(`   Copiez manuellement le contenu de ${MODS_SOURCE} dans ${BALATRO_APPDATA}`);
    }
}

async function loadSave() {
    step("Chargement de la sauvegarde de départ");
    try {
        run("npm run load-save");
        log("✔ Sauvegarde de départ installée.");
    } catch (err) {
        console.warn(`⚠️  'npm run load-save' a échoué : ${err.message}`);
        console.warn("   Vous pourrez relancer cette commande manuellement plus tard.");
    }
}

async function main() {
    console.log("Installation de balatroce");
    console.log(`Dossier du projet : ${PROJECT_ROOT}`);
    console.log(`Dossier Balatro (AppData) : ${BALATRO_APPDATA}`);

    await installDependenciesAndBuild();
    await setupEnvironmentVariables();
    await ensureBalatroInstalled();
    await copyMods();
    await loadSave();

    console.log("\n✅ Installation terminée.");
    console.log("Ouvrez un nouveau terminal (ou redémarrez votre PC) pour que les variables d'environnement");
    console.log("soient prises en compte, puis démarrez le serveur avec : npm run start:prod");
}

main().catch((err) => {
    console.error("\n❌ L'installation s'est arrêtée à cause d'une erreur.");
    console.error(err && err.message ? err.message : err);
    process.exitCode = 1;
});





