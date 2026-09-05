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
const VERSION_DLL_SOURCE = path.join(PROJECT_ROOT, "ressources", "version.dll");
const BALATRO_APPDATA = path.join(process.env.APPDATA || "", "Balatro");
const BALATRO_MODS_DIR = path.join(BALATRO_APPDATA, "Mods");
const DEFAULT_STEAM_PATH = "C:\\Program Files (x86)\\Steam";

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

function isEnvVarDefined(name) {
    return process.env[name] !== undefined;
}

/** Copie récursivement un dossier, en fusionnant avec le contenu existant. */
function copyRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(src, dest, { recursive: true, force: true });
}

/** Lit une valeur de chaîne (REG_SZ) dans le registre Windows. Retourne null si introuvable. */
function queryRegistryValue(key, value) {
    try {
        const output = execSync(`reg query "${key}" /v ${value}`, { stdio: ["ignore", "pipe", "ignore"] }).toString();
        const match = output.match(/REG_(?:SZ|EXPAND_SZ)\s+(.+)/);
        return match ? match[1].trim() : null;
    } catch {
        return null;
    }
}

/** Détermine le dossier d'installation de Steam (registre, sinon chemin par défaut). */
function findSteamInstallPath() {
    return (
        queryRegistryValue("HKCU\\Software\\Valve\\Steam", "SteamPath") ||
        queryRegistryValue("HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam", "InstallPath") ||
        queryRegistryValue("HKLM\\SOFTWARE\\Valve\\Steam", "InstallPath") ||
        DEFAULT_STEAM_PATH
    );
}

/** Liste tous les dossiers de bibliothèque Steam (installation par défaut + bibliothèques additionnelles). */
function getSteamLibraryFolders(steamPath) {
    const libraries = [steamPath];
    const vdfPath = path.join(steamPath, "steamapps", "libraryfolders.vdf");
    if (fs.existsSync(vdfPath)) {
        try {
            const content = fs.readFileSync(vdfPath, "utf8");
            const regex = /"path"\s+"([^"]+)"/g;
            let match;
            while ((match = regex.exec(content))) {
                libraries.push(match[1].replace(/\\\\/g, "\\"));
            }
        } catch {
            // Fichier illisible : on se contente du dossier Steam par défaut.
        }
    }
    return libraries;
}

/** Cherche le dossier d'installation du jeu Balatro dans toutes les bibliothèques Steam connues. */
function findBalatroGameDir() {
    const steamPath = findSteamInstallPath();
    const libraries = getSteamLibraryFolders(steamPath);
    for (const library of libraries) {
        const candidate = path.join(library, "steamapps", "common", "Balatro");
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return path.join(DEFAULT_STEAM_PATH, "steamapps", "common", "Balatro");
}

async function installDependenciesAndBuild() {
    step("Installation des dépendances overlay (npm install)");
    try {
        run("cd overlay && npm install && cd ..");
    } catch (err) {
        console.error("❌ 'npm install' a échoué. Vérifiez votre connexion internet puis relancez le script.");
        throw err;
    }
    
    step("Installation des dépendances serveur (npm install)");
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
        if (isEnvVarDefined(name)) {
            log(`✔ ${name} déjà défini, valeur existante conservée.`);
            continue;
        }

        try {
            setPersistentEnvVar(name, value);
            log(`✔ ${name}=${value}`);
        } catch (err) {
            console.warn(`⚠️  Impossible de définir ${name} automatiquement : ${err.message}`);
            console.warn(`   Vous pourrez la définir plus tard avec scripts/configure-env.bat`);
        }
    }

    if (isEnvVarDefined("STREAMLABS_SOCKET_TOKEN")) {
        log("✔ STREAMLABS_SOCKET_TOKEN déjà défini, valeur existante conservée.");
        return;
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
        fs.mkdirSync(BALATRO_MODS_DIR, { recursive: true });
        copyRecursive(MODS_SOURCE, BALATRO_MODS_DIR);
        log(`✔ Mods copiés dans ${BALATRO_MODS_DIR}`);
    } catch (err) {
        console.warn(`⚠️  Impossible de copier les mods automatiquement : ${err.message}`);
        console.warn(`   Copiez manuellement le contenu de ${MODS_SOURCE} dans ${BALATRO_MODS_DIR}`);
    }
}

async function copyVersionDll() {
    step("Installation de l'injecteur Lovely (version.dll)");

    if (!fs.existsSync(VERSION_DLL_SOURCE)) {
        console.warn(`⚠️  Fichier ${VERSION_DLL_SOURCE} introuvable, cette étape est ignorée.`);
        return;
    }

    const gameDir = findBalatroGameDir();
    if (!fs.existsSync(gameDir)) {
        console.warn(`⚠️  Dossier d'installation de Balatro introuvable (${gameDir}).`);
        console.warn(`   Copiez manuellement ${VERSION_DLL_SOURCE} dans le dossier d'installation de Balatro.`);
        return;
    }

    try {
        fs.copyFileSync(VERSION_DLL_SOURCE, path.join(gameDir, "version.dll"));
        log(`✔ version.dll copié dans ${gameDir}`);
    } catch (err) {
        console.warn(`⚠️  Impossible de copier version.dll automatiquement : ${err.message}`);
        console.warn(`   Copiez-le manuellement dans ${gameDir}`);
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
    await copyVersionDll();
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








