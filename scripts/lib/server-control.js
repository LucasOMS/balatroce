// Utilitaires pour détecter si le serveur balatroce tourne déjà (en écoute
// sur son port HTTP) et le redémarrer proprement.

const { execSync, spawn } = require("child_process");

/**
 * Cherche le PID du processus en écoute (LISTENING) sur le port donné,
 * via `netstat`. Retourne `null` si aucun processus n'est trouvé.
 */
function findPidListeningOnPort(port) {
    try {
        const output = execSync("netstat -ano -p tcp", { encoding: "utf8" });
        const line = output
            .split("\n")
            .find((l) => l.includes(`:${port} `) && l.toUpperCase().includes("LISTENING"));
        if (!line) return null;
        const parts = line.trim().split(/\s+/);
        return parts[parts.length - 1] || null;
    } catch {
        return null;
    }
}

/**
 * Si le serveur balatroce semble démarré (port à l'écoute), l'arrête puis le
 * relance dans une nouvelle fenêtre (via `npm run start:prod`).
 */
function restartServerIfRunning(projectRoot) {
    const port = process.env.PORT || "3000";
    const pid = findPidListeningOnPort(port);

    if (!pid) {
        console.log("ℹ️  Le serveur ne semble pas démarré (rien à redémarrer).");
        return;
    }

    console.log(`🔄 Serveur détecté (PID ${pid}, port ${port}), redémarrage en cours...`);

    try {
        execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore" });
    } catch (err) {
        console.warn(`⚠️  Impossible d'arrêter proprement le serveur : ${err.message}`);
    }

    try {
        const child = spawn(
            "cmd.exe",
            ["/c", "start", "Balatroce", "cmd", "/k", "npm run start:prod"],
            { cwd: projectRoot, detached: true, stdio: "ignore" },
        );
        child.unref();
        console.log("✔ Serveur relancé dans une nouvelle fenêtre.");
    } catch (err) {
        console.warn(`⚠️  Impossible de relancer le serveur automatiquement : ${err.message}`);
        console.warn("   Relancez-le manuellement avec : npm run start:prod");
    }
}

module.exports = { restartServerIfRunning, findPidListeningOnPort };


