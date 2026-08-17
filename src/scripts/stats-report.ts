import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Script CLI de reporting des statistiques de la chaîne : lit le fichier de
 * statistiques (mis à jour en temps réel par `StatsService` pendant que le
 * serveur tourne) et affiche un résumé lisible, avec les métriques calculées
 * à la demande (nombre de joueurs uniques, podium des joueurs les plus
 * actifs, etc.) plutôt que maintenues en continu.
 *
 * Utilisé via `npm run stats:report`.
 */

const STATS_FILE = process.env.STATS_PATH ?? path.join(process.cwd(), "data", "stats.json");
const PLAYER_LOG_FILE =
  process.env.STATS_PLAYER_LOG_PATH ?? path.join(process.cwd(), "data", "player-commands.log");

/** Traduction française des noms de mains de poker de Balatro (`HandType`) */
const HAND_TYPE_LABELS_FR: Record<string, string> = {
  "High Card": "Carte Haute",
  "Pair": "Paire",
  "Two Pair": "Double Paire",
  "Three of a Kind": "Brelan",
  "Straight": "Suite",
  "Flush": "Couleur",
  "Full House": "Full",
  "Four of a Kind": "Carré",
  "Straight Flush": "Quinte Flush",
  "Five of a Kind": "Cinq Identiques",
  "Flush House": "Full Couleur",
  "Flush Five": "Couleur Quintuple",
};

interface PersistedStats {
  totalVotes: number;
  totalDonations: number;
  anarchyTimeMs: number;
  democracyTimeMs: number;
  gamesWon: number;
  gamesLost: number;
  handsPlayed: Record<string, number>;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours.toString()}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes.toString()}min`);
  parts.push(`${seconds.toString()}s`);
  return parts.join(" ");
}

/**
 * Lit le journal des commandes joueurs (une ligne = un pseudo, voir
 * `StatsService.recordPlayerCommand`) et compte le nombre de commandes par
 * pseudo. Cette agrégation n'est faite qu'ici, à la demande (au lancement du
 * script), jamais en continu pendant que le serveur tourne : c'est ce qui
 * permet de garder un simple fichier en append, bon marché quel que soit le
 * nombre de participants.
 */
function countPlayerCommands(): Map<string, number> {
  const counts = new Map<string, number>();
  if (!fs.existsSync(PLAYER_LOG_FILE)) {
    return counts;
  }
  const raw = fs.readFileSync(PLAYER_LOG_FILE, "utf-8");
  for (const line of raw.split("\n")) {
    const username = line.trim();
    if (!username) {
      continue;
    }
    counts.set(username, (counts.get(username) ?? 0) + 1);
  }
  return counts;
}

function main(): void {
  const playerCounts = countPlayerCommands();
  const players = [...playerCounts.entries()].sort(([, a], [, b]) => b - a);
  const uniquePlayers = players.length;
  const top3 = players.slice(0, 3);

  if (!fs.existsSync(STATS_FILE)) {
    console.log(`Aucun fichier de statistiques agrégées trouvé (${STATS_FILE}).`);
    console.log("Le serveur n'a peut-être pas encore été lancé.");
    if (uniquePlayers > 0) {
      console.log();
      console.log(`(Le journal des joueurs, lui, contient ${uniquePlayers.toString()} joueur(s) unique(s).)`);
    }
    return;
  }

  const raw = fs.readFileSync(STATS_FILE, "utf-8");
  const stats = JSON.parse(raw) as PersistedStats;

  const totalPlaytimeMs = (stats.anarchyTimeMs ?? 0) + (stats.democracyTimeMs ?? 0);

  const handsPlayed = Object.entries(stats.handsPlayed ?? {}).sort(([, a], [, b]) => b - a);

  console.log("═══════════════════════════════════════════");
  console.log("  STATISTIQUES BALATRO TWITCH PLAYS");
  console.log("═══════════════════════════════════════════");
  console.log();
  console.log(`Fichier de statistiques : ${STATS_FILE}`);
  console.log(`Journal des joueurs     : ${PLAYER_LOG_FILE}`);
  console.log();

  console.log("── Joueurs ─────────────────────────────────");
  console.log(`Joueurs uniques : ${uniquePlayers.toString()}`);
  console.log(`Votes totaux    : ${(stats.totalVotes ?? 0).toString()}`);
  console.log("Top 3 des joueurs les plus actifs :");
  if (top3.length === 0) {
    console.log("  (aucun joueur enregistré)");
  } else {
    top3.forEach(([username, count], index) => {
      console.log(`  ${(index + 1).toString()}. ${username} — ${count.toString()} commande(s)`);
    });
  }
  console.log();

  console.log("── Dons ────────────────────────────────────");
  console.log(`Total récolté : ${(stats.totalDonations ?? 0).toFixed(2)} €`);
  console.log();

  console.log("── Temps de jeu ────────────────────────────");
  console.log(`Anarchie   : ${formatDuration(stats.anarchyTimeMs ?? 0)}`);
  console.log(`Démocratie : ${formatDuration(stats.democracyTimeMs ?? 0)}`);
  console.log(`Total      : ${formatDuration(totalPlaytimeMs)}`);
  console.log();

  console.log("── Parties ─────────────────────────────────");
  console.log(`Gagnées : ${(stats.gamesWon ?? 0).toString()}`);
  console.log(`Perdues : ${(stats.gamesLost ?? 0).toString()}`);
  console.log();

  console.log("── Mains jouées ────────────────────────────");
  if (handsPlayed.length === 0) {
    console.log("  (aucune main enregistrée)");
  } else {
    for (const [handType, count] of handsPlayed) {
      const label = HAND_TYPE_LABELS_FR[handType] ?? handType;
      console.log(`  ${label.padEnd(20)} : ${count.toString()}`);
    }
  }
  console.log("═══════════════════════════════════════════");
}

main();




