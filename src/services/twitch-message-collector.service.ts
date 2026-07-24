import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Subject } from "rxjs";
import { auditTime } from "rxjs/operators";
import * as tmi from "tmi.js";
import { isActionMessage } from "../parsers/parse-all.parser";

/**
 * Se connecte au chat Twitch et enregistre le dernier message (en lowercase)
 * de chaque utilisateur qui commence par un ActionKeyword.
 *
 * Variables d'environnement :
 * - TWITCH_MOCK : si "true", ne se connecte pas réellement à Twitch (utile en dev/tests,
 *   les messages peuvent alors être injectés via TestController)
 * - TWITCH_CHANNEL : nom de la chaîne Twitch à écouter (sans le #)
 * - TWITCH_BOT_USERNAME / TWITCH_OAUTH_TOKEN : identifiants optionnels (lecture anonyme sinon)
 */
@Injectable()
export class TwitchMessageCollectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TwitchMessageCollectorService.name);
  private client: tmi.Client | null = null;

  /** Dernier message (lowercase) de chaque utilisateur, indexé par nom d'utilisateur */
  private readonly lastMessageByUser = new Map<string, string>();

  private readonly newMessageSubject = new Subject<void>();
  /** Émet à chaque fois que de nouveaux messages ont été enregistrés (max 1 fois / seconde) */
  public readonly newMessages$ = this.newMessageSubject.pipe(auditTime(1000));

  public async onModuleInit(): Promise<void> {
    if (process.env.TWITCH_MOCK === "true") {
      this.logger.warn(
        "TWITCH_MOCK=true : connexion Twitch désactivée. Utilisez /debug/twitch/:user/:message pour simuler des messages.",
      );
      return;
    }

    const channel = process.env.TWITCH_CHANNEL;
    if (!channel) {
      this.logger.warn("TWITCH_CHANNEL non défini : connexion Twitch désactivée.");
      return;
    }

    const username = process.env.TWITCH_BOT_USERNAME ?? 'Balatroce';
    const password = process.env.TWITCH_OAUTH_TOKEN;

    this.client = new tmi.Client({
      options: { debug: false },
      identity: username && password ? { username, password } : undefined,
      channels: [channel],
    });

    this.client.on("message", (_channel, tags, message) => {
      const author = tags["display-name"] ?? tags.username ?? "unknown";
      this.registerMessage(author, message);
    });

    try {
      await this.client.connect();
      this.logger.log(`Connecté au chat Twitch : #${channel}`);
    } catch (err) {
      this.logger.error(`Impossible de se connecter au chat Twitch : ${(err as Error).message}`);
    }
  }

  public async onModuleDestroy(): Promise<void> {
    await this.client?.disconnect();
  }

  /**
   * Enregistre le message d'un utilisateur s'il commence par un ActionKeyword.
   * Utilisé aussi bien par la connexion Twitch réelle que par le mock de test.
   */
  public registerMessage(username: string, rawMessage: string): void {
    const message = rawMessage.toLowerCase().trim();

    if (!isActionMessage(message)) {
      return;
    }

    this.lastMessageByUser.set(username, message);
    this.newMessageSubject.next();
  }

  /** Vide la liste des messages enregistrés */
  public clear(): void {
    this.lastMessageByUser.clear();
  }

  /** Nombre de messages actuellement stockés */
  public getMessageCount(): number {
    return this.lastMessageByUser.size;
  }

  /** Les derniers messages stockés, indexés par utilisateur */
  public getMessages(): ReadonlyMap<string, string> {
    return this.lastMessageByUser;
  }
}

