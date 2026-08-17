import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";
import { AppModule } from "./app.module";

const execAsync = promisify(exec);
const logger = new Logger("Bootstrap");

/** URL de l'API BalatroBot (mod Lua tournant dans le jeu) */
const BALATROBOT_URL = "http://127.0.0.1:12346";
/** Délai (ms) laissé à l'API BalatroBot pour répondre lors du check de démarrage */
const STARTUP_HEALTHCHECK_TIMEOUT_MS = 1500;

// Filet de sécurité : une erreur de communication (bot/jeu injoignable, etc.)
// ne doit jamais faire crasher tout le serveur NestJS. Les services concernés
// interceptent déjà leurs erreurs, mais on journalise aussi tout ce qui
// passerait au travers plutôt que de laisser Node terminer le process.
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled promise rejection : ${String(reason)}`);
});
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught exception : ${err.message}`, err.stack);
});

/**
 * Vérifie rapidement si l'API BalatroBot répond déjà (jeu déjà lancé), sans
 * attendre ni retenter (contrairement à `BotHttpService`, qui lui boucle
 * indéfiniment une fois l'application NestJS initialisée).
 */
async function isBalatroBotReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), STARTUP_HEALTHCHECK_TIMEOUT_MS);
    try {
      const response = await fetch(BALATROBOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "health", id: 0 }),
        signal: controller.signal,
      });
      return response.ok;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}

/**
 * Lance Balatro au démarrage du serveur si l'API BalatroBot n'est pas déjà
 * joignable. Sans cela, l'initialisation de NestJS resterait bloquée
 * indéfiniment sur `BotHttpService.onModuleInit` en attendant un jeu qu'il
 * faudrait alors démarrer manuellement.
 *
 * Variable d'environnement :
 * - AUTO_LAUNCH_GAME : si "false", désactive le lancement automatique du jeu
 *   (utile en dev si le jeu est déjà géré manuellement). Défaut "true".
 */
async function ensureGameIsRunning(): Promise<void> {
  if (process.env.AUTO_LAUNCH_GAME === "false") {
    logger.warn("AUTO_LAUNCH_GAME=false : lancement automatique du jeu désactivé.");
    return;
  }

  if (await isBalatroBotReachable()) {
    logger.log("Balatro est déjà lancé et joignable, pas de relance au démarrage.");
    return;
  }

  logger.log("Balatro n'est pas joignable, lancement du jeu...");
  try {
    await execAsync("npm run launch-game");
  } catch (err) {
    logger.error(`Impossible de lancer Balatro automatiquement : ${(err as Error).message}`);
  }
}

async function bootstrap() {
  await ensureGameIsRunning();

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "*" });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();


