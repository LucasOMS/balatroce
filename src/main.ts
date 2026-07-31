import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";

const logger = new Logger("Bootstrap");

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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "*" });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
