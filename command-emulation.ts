/**
 * Script de debug interactif pour balatroce.
 *
 * Prérequis : serveur NestJS démarré (npm run start:dev)
 * Lancement  : npm run emulate-commands [-- --port 3000]
 *
 * Commandes disponibles :
 *   <mot-clé> [args]   → simule un message chat (ex: jouer 1 2 3)
 *   etat                → affiche le gamestate courant
 *   aide                → liste les mots-clés
 *   exit / Ctrl+C       → quitter
 *
 * Commandes de debug (bypass parser) :
 *   debug set <champ> <valeur>   → modifie une valeur de jeu
 *   debug add <clé>              → ajoute une carte par clé (j_joker, c_magician, ...)
 *   debug money <montant>        → raccourci pour définir l'argent
 *
 * Champs pour "debug set" :
 *   money, chips, ante, round, hands, discards
 *   hand_size, joker_slots, consumable_slots
 *
 * Modes (commande "mode <mode>") :
 *   admin  (défaut) → les commandes sont directement exécutées par le serveur
 *                      (bypass du vote Twitch Plays, pratique pour développer)
 *   twitch          → les commandes sont envoyées comme si elles venaient du chat
 *                      Twitch (elles entrent dans le système de vote). Utilisez
 *                      "user <pseudo>" pour changer l'utilisateur simulé.
 */

import * as readline from "node:readline";
import {ActionKeyword} from "./src/enums/action-keywords.enum";
import {BidWarKeyword} from "./shared/bid-war-keyword";

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = `http://localhost:3000`;

type EmulationMode = "admin" | "twitch";

let mode: EmulationMode = "admin";
let twitchUser = "twitchuser";

// ── Helpers ───────────────────────────────────────────────────────────────────

function printHelp(): void {
    console.log("\n── Mots-clés disponibles ──────────────────────────────");
    for (const [, keyword] of Object.entries(ActionKeyword)) {
        console.log(`  ${keyword.padEnd(20)}`);
    }
    console.log("\n  etat              → affiche l'état du jeu");
    console.log("  aide              → affiche ce message");
    console.log("  redemarrer        → déclenche une relance manuelle du jeu (test du watchdog)");
    console.log("  exit / Ctrl+C    → quitter");

    console.log("\n── Modes ───────────────────────────────────────────────");
    console.log("  mode admin        → exécute directement les commandes (défaut)");
    console.log("  mode twitch       → simule des messages du chat Twitch (entre dans le vote)");
    console.log("  user <pseudo>     → change l'utilisateur simulé en mode twitch");

    console.log("\n── Bid war (dons Streamlabs, mode STREAMLABS_MOCK) ─────");
    console.log("  don <mot-clé> <montant>");
    console.log(`    Mots-clés : ${Object.values(BidWarKeyword).join(", ")}`);
    console.log("    Ex: don democratie 5");
    console.log("    Ex: don anarchie 10");

    console.log("\n── Commandes de debug ─────────────────────────────────");
    console.log("  debug set <champ> <valeur>");
    console.log("    Champs : money, chips, ante, round, hands, discards,");
    console.log("             hand_size, joker_slots, consumable_slots");
    console.log("    Ex: debug set hand_size 10");
    console.log("    Ex: debug set joker_slots 8");
    console.log("    Ex: debug set consumable_slots 5");
    console.log("    Ex: debug set money 999");
    console.log("  debug add <clé>");
    console.log("    Ex: debug add j_joker          (ajouter un joker)");
    console.log("    Ex: debug add c_magician        (ajouter le Magicien)");
    console.log("    Ex: debug add v_overstock       (ajouter un voucher)");
    console.log("  debug money <montant>");
    console.log("    Ex: debug money 500");
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
            console.log("✅ Commande envoyée (admin, exécution directe).");
        } else {
            const text = await res.text();
            console.log(`⚠️  Réponse ${res.status.toString()} : ${text}`);
        }
    } catch (e: unknown) {
        console.error(`❌ Erreur réseau : ${(e as Error).message}`);
        console.error(`   URL : ${url}`);
    }
}

async function simulateTwitchMessage(user: string, cmd: string): Promise<void> {
    const encoded = cmd.trim().replaceAll(" ", "_");
    const url = `${BASE_URL}/debug/twitch/${encodeURIComponent(user)}/${encodeURIComponent(encoded)}`;
    try {
        const res = await fetch(url);
        if (res.ok) {
            console.log(`✅ Message envoyé comme si "${user}" l'avait tapé dans le chat Twitch.`);
        } else {
            const text = await res.text();
            console.log(`⚠️  Réponse ${res.status.toString()} : ${text}`);
        }
    } catch (e: unknown) {
        console.error(`❌ Erreur réseau : ${(e as Error).message}`);
        console.error(`   URL : ${url}`);
    }
}

async function simulateDonation(keyword: string, amount: string): Promise<void> {
    const url = `${BASE_URL}/debug/donation/${encodeURIComponent(keyword)}/${encodeURIComponent(amount)}`;
    try {
        const res = await fetch(url);
        const data: unknown = await res.json();
        if (res.ok && !(data && typeof data === "object" && "error" in data)) {
            console.log(`✅ Don simulé : ${keyword} → ${amount}`);
        } else {
            console.log(`⚠️  Réponse ${res.status.toString()} : ${JSON.stringify(data)}`);
        }
    } catch (e: unknown) {
        console.error(`❌ Erreur réseau : ${(e as Error).message}`);
        console.error(`   URL : ${url}`);
    }
}

/**
 * Déclenche manuellement une relance du jeu, comme si le GameWatchdogService
 * avait détecté un plantage (message de redémarrage sur l'overlay, pause du
 * vote Twitch, arrêt puis relance de Balatro via les scripts npm).
 */
async function triggerRestart(): Promise<void> {
    const url = `${BASE_URL}/admin/restart-game`;
    try {
        const res = await fetch(url);
        const data: unknown = await res.json();
        if (res.ok) {
            console.log("✅ Relance du jeu déclenchée (voir les logs du serveur NestJS).");
            console.log(`   ${JSON.stringify(data)}`);
        } else {
            console.log(`⚠️  Réponse ${res.status.toString()} : ${JSON.stringify(data)}`);
        }
    } catch (e: unknown) {
        console.error(`❌ Erreur réseau : ${(e as Error).message}`);
        console.error(`   URL : ${url}`);
    }
}


async function handleDebug(parts: string[]): Promise<void> {
    if (parts.length < 2) {
        console.log("⚠️  Usage : debug <set|add|money> [args...]");
        return;
    }
    const subCmd = parts[1].toLowerCase();

    if (subCmd === "set") {
        // debug set <champ> <valeur>
        if (parts.length !== 4) {
            console.log("⚠️  Usage : debug set <champ> <valeur>");
            console.log("   Champs : money, chips, ante, round, hands, discards, hand_size, joker_slots, consumable_slots");
            return;
        }
        const field = parts[2];
        const value = parts[3];
        const url = `${BASE_URL}/debug/set?field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`;
        try {
            const res = await fetch(url);
            const data: unknown = await res.json();
            if (res.ok) {
                console.log(`✅ ${field} = ${value}`);
                if (data && typeof data === "object" && "state" in data) {
                    const d = data as {state?: unknown; money?: unknown};
                    console.log(`   état=${String(d.state ?? "?")}  argent=${String(d.money ?? "?")}`);
                }
            } else {
                console.log(`⚠️  Erreur ${res.status.toString()} : ${JSON.stringify(data)}`);
            }
        } catch (e: unknown) {
            console.error(`❌ Erreur réseau : ${(e as Error).message}`);
        }

    } else if (subCmd === "add") {
        // debug add <clé>
        if (parts.length !== 3) {
            console.log("⚠️  Usage : debug add <clé>  (ex: j_joker, c_magician, v_overstock)");
            return;
        }
        const key = parts[2];
        const url = `${BASE_URL}/debug/add/${encodeURIComponent(key)}`;
        try {
            const res = await fetch(url);
            const data: unknown = await res.json();
            if (res.ok) {
                console.log(`✅ Carte ajoutée : ${key}`);
            } else {
                console.log(`⚠️  Erreur ${res.status.toString()} : ${JSON.stringify(data)}`);
            }
        } catch (e: unknown) {
            console.error(`❌ Erreur réseau : ${(e as Error).message}`);
        }

    } else if (subCmd === "money") {
        // debug money <montant>
        if (parts.length !== 3) {
            console.log("⚠️  Usage : debug money <montant>");
            return;
        }
        const amount = parts[2];
        const url = `${BASE_URL}/debug/money/${encodeURIComponent(amount)}`;
        try {
            const res = await fetch(url);
            const data: unknown = await res.json();
            if (res.ok) {
                console.log(`✅ Argent défini à ${amount}`);
            } else {
                console.log(`⚠️  Erreur ${res.status.toString()} : ${JSON.stringify(data)}`);
            }
        } catch (e: unknown) {
            console.error(`❌ Erreur réseau : ${(e as Error).message}`);
        }

    } else {
        console.log(`⚠️  Sous-commande inconnue : "${subCmd}". Essaie : set, add, money`);
    }
}

// ── REPL ──────────────────────────────────────────────────────────────────────

function startRepl(): void {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const loop = (): void => {
        rl.question(`[${mode}${mode === "twitch" ? `:${twitchUser}` : ""}] › `, (input: string) => {
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
                } else if (trimmed === "redemarrer" || trimmed === "restart") {
                    await triggerRestart();
                } else if (trimmed.toLowerCase().startsWith("mode")) {
                    const parts = trimmed.split(/\s+/);
                    const newMode = parts[1]?.toLowerCase();
                    if (newMode === "admin" || newMode === "twitch") {
                        mode = newMode;
                        console.log(`✅ Mode changé : ${mode}`);
                    } else {
                        console.log('⚠️  Usage : mode <admin|twitch>');
                    }
                } else if (trimmed.toLowerCase().startsWith("user")) {
                    const parts = trimmed.split(/\s+/);
                    if (parts.length !== 2) {
                        console.log("⚠️  Usage : user <pseudo>");
                    } else {
                        twitchUser = parts[1];
                        console.log(`✅ Utilisateur Twitch simulé : ${twitchUser}`);
                    }
                } else if (trimmed.toLowerCase().startsWith("debug")) {
                    // Commande de debug directe (bypass parser + game cycle + vote)
                    const parts = trimmed.split(/\s+/);
                    await handleDebug(parts);
                } else if (trimmed.toLowerCase().startsWith("don ")) {
                    // don <mot-clé> <montant> → simule un don Streamlabs pour la bid war
                    const parts = trimmed.split(/\s+/);
                    if (parts.length !== 3) {
                        console.log("⚠️  Usage : don <mot-clé> <montant>");
                        console.log(`   Mots-clés : ${Object.values(BidWarKeyword).join(", ")}`);
                    } else {
                        await simulateDonation(parts[1], parts[2]);
                    }
                } else {
                    // Accepte avec ou sans "!"
                    const cmd = trimmed.startsWith("!") ? trimmed.slice(1) : trimmed;
                    if (mode === "twitch") {
                        await simulateTwitchMessage(twitchUser, cmd);
                    } else {
                        await simulate(cmd);
                    }
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

