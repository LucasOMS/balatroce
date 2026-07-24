import {Injectable, Logger, OnModuleDestroy, OnModuleInit} from "@nestjs/common";
import {Subject} from "rxjs";
import {auditTime} from "rxjs/operators";
import * as tmi from "tmi.js";
import {isActionMessage} from "../parsers/parse-all.parser";
import {TwitchAuthService} from "./twitch-auth.service";

/**
 * Se connecte au chat Twitch et enregistre le dernier message (en lowercase)
 * de chaque utilisateur qui commence par un ActionKeyword.
 *
 * Variables d'environnement :
 * - TWITCH_MOCK : si "true", ne se connecte pas réellement à Twitch (utile en dev/tests,
 *   les messages peuvent alors être injectés via TestController)
 * - TWITCH_CHANNEL : nom de la chaîne Twitch à écouter (sans le #)
 *
 * L'authentification (pseudo + token OAuth) n'est PAS lue depuis des
 * variables d'environnement : elle est stockée dans `twitch-auth.json` par
 * TwitchAuthService, obtenu en visitant GET /auth/twitch/login.
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

    constructor(private readonly twitchAuthService: TwitchAuthService) {
    }

    public async onModuleInit(): Promise<void> {
        if (process.env.TWITCH_MOCK === "true") {
            this.logger.warn(
                "TWITCH_MOCK=true : connexion Twitch désactivée. Utilisez /debug/twitch/:user/:message pour simuler des messages.",
            );
            return;
        }

        const channel = process.env.TWITCH_CHANNEL;
        if (!channel) {
            throw new Error("TWITCH_CHANNEL non défini : impossible de se connecter au chat Twitch.");
        }

        if (!this.twitchAuthService.isAuthenticated()) {
            const port = process.env.PORT ?? "3000";
            throw new Error(`Aucun token Twitch enregistré. Ouvrez http://localhost:${port}/auth/twitch/login dans un navigateur pour vous authentifier, puis redémarrez le serveur.`);
        }

        await this.connect(channel);
    }

    public async onModuleDestroy(): Promise<void> {
        await this.client?.disconnect();
    }

    private async connect(channel: string, isRetry = false): Promise<void> {
        const username = this.twitchAuthService.getUsername();
        const accessToken = this.twitchAuthService.getAccessToken();

        this.client = new tmi.Client({
            options: {debug: false},
            identity: username && accessToken ? {username, password: `oauth:${accessToken}`} : undefined,
            channels: [channel],
        });

        this.client.on("message", (_channel, tags, message) => {
            const author = tags["display-name"] ?? tags.username ?? "unknown";
            this.registerMessage(author, message);
        });

        try {
            await this.client.connect();
            this.logger.log(`Connecté au chat Twitch : #${channel} (compte ${username ?? "?"})`);
        } catch (err) {
            this.logger.error(`Impossible de se connecter au chat Twitch : ${(err as Error).message}`);

            if (!isRetry) {
                this.logger.warn("Tentative de rafraîchissement du token Twitch...");
                const refreshed = await this.twitchAuthService.refresh();
                if (refreshed) {
                    this.logger.log("Token rafraîchi, nouvelle tentative de connexion...");
                    await this.connect(channel, true);
                    return;
                }
                this.logger.error(
                    `Le token Twitch semble invalide. Ré-authentifiez-vous via GET /auth/twitch/login.`,
                );
            }
        }
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


