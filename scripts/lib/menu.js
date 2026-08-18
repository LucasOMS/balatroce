// Petit menu interactif en ligne de commande, navigable avec les flèches
// haut/bas, validé avec Entrée ou Espace. Pas de dépendance externe.

const readline = require("readline");

/**
 * Affiche un menu et retourne l'item choisi par l'utilisateur (ou `null` si
 * annulé avec Échap / Ctrl+C).
 *
 * @param {{label: string, description?: string, value: any}[]} items
 * @param {string} title
 */
function selectFromMenu(items, title) {
    return new Promise((resolve) => {
        let index = 0;
        const wasRaw = process.stdin.isTTY && process.stdin.isRaw;
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        process.stdin.resume();

        const render = () => {
            console.clear();
            console.log(`${title}\n`);
            items.forEach((item, i) => {
                const marker = i === index ? "➤ " : "  ";
                console.log(`${marker}${item.label}`);
                if (i === index && item.description) {
                    console.log(`    ${item.description}`);
                }
            });
            console.log("\n(Flèches ↑/↓ pour naviguer, Entrée ou Espace pour valider, Échap pour quitter)");
        };

        const cleanup = () => {
            process.stdin.removeListener("keypress", onKeypress);
            if (process.stdin.isTTY) process.stdin.setRawMode(wasRaw || false);
        };

        const onKeypress = (str, key) => {
            if (!key) return;
            if (key.name === "up") {
                index = (index - 1 + items.length) % items.length;
                render();
            } else if (key.name === "down") {
                index = (index + 1) % items.length;
                render();
            } else if (key.name === "return" || str === " ") {
                cleanup();
                resolve(items[index]);
            } else if (key.name === "escape" || (key.ctrl && key.name === "c")) {
                cleanup();
                resolve(null);
            }
        };

        process.stdin.on("keypress", onKeypress);
        render();
    });
}

module.exports = { selectFromMenu };

