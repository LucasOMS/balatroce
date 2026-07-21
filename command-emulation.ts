/**
 * Script de debug interactif pour balatroce.
 *
 * Prérequis : serveur NestJS démarré (npm run start:dev)
 * Lancement  : npm run debug [-- --port 3000]
 *
 * Commandes disponibles :
 *   <mot-clé> [args]   → simule un message chat (ex: jouer 1 2 3)
 *   etat                → affiche le gamestate courant
 *   aide                → liste les mots-clés
 *   exit / Ctrl+C       → quitter
 */

import * as readline from "node:readline";
import {ActionKeyword} from "./src/enums/action-keywords.enum";

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = `http://localhost:3000`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function printHelp(): void {
    console.log("\n── Mots-clés disponibles ──────────────────────────────");
    for (const [, keyword] of Object.entries(ActionKeyword)) {
        console.log(`  ${keyword.padEnd(20)}`);
    }
    console.log("\n  etat              → affiche l'état du jeu");
    console.log("  aide              → affiche ce message");
    console.log("  exit / Ctrl+C    → quitter");
    console.log("────────────────────────────────────────────────────────\n");
}

async function getState(): Promise<void> {
    try {
        const res = await fetch(`${BASE_URL}/`);
        const data: unknown = await res.json();
        console.log("\n📊 État du jeu :");
        console.log(JSON.stringify(data, null, 2));
    } catch (e: unknown) {
        console.error(`❌ Erreur état : ${(e as Error).message}`);
    }
}

async function simulate(cmd: string): Promise<void> {
    const encoded = cmd.trim().replaceAll(" ", "_");
    const url = `${BASE_URL}/simulate/${encodeURIComponent(encoded)}`;
    try {
        const res = await fetch(url);
        if (res.ok) {
            console.log("✅ Commande envoyée.");
        } else {
            const text = await res.text();
            console.log(`⚠️  Réponse ${res.status.toString()} : ${text}`);
        }
    } catch (e: unknown) {
        console.error(`❌ Erreur réseau : ${(e as Error).message}`);
        console.error(`   URL : ${url}`);
    }
}

// ── REPL ──────────────────────────────────────────────────────────────────────

function startRepl(): void {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const loop = (): void => {
        rl.question("› ", (input: string) => {
            const trimmed = input.trim();

            if (!trimmed) {
                loop();
                return;
            }

            void (async () => {
                if (trimmed === "exit" || trimmed === "quit") {
                    console.log("Au revoir !");
                    rl.close();
                    return;
                }

                if (trimmed === "aide" || trimmed === "help") {
                    printHelp();
                } else if (trimmed === "etat" || trimmed === "state") {
                    await getState();
                } else {
                    // Accepte avec ou sans "!"
                    const cmd = trimmed.startsWith("!") ? trimmed.slice(1) : trimmed;
                    await simulate(cmd);
                }

                loop();
            })();
        });
    };

    loop();
}

// ── Démarrage ─────────────────────────────────────────────────────────────────

console.log(`\n🃏 BalatroBot Debug REPL  —  ${BASE_URL}`);
console.log('Tape "aide" pour voir les commandes disponibles.\n');

fetch(`${BASE_URL}/`)
    .then(() => {
        console.log("✅ Serveur accessible.\n");
    })
    .catch(() => {
        console.warn(
            `⚠️  Serveur inaccessible (${BASE_URL}). Lance d'abord : npm run start:dev\n`,
        );
    })
    .finally(() => {
        startRepl();
    });

