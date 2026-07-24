import {Injectable, Logger, OnModuleDestroy, OnModuleInit} from "@nestjs/common";
import {Subject} from "rxjs";
import {auditTime} from "rxjs/operators";
import * as tmi from "tmi.js";
import {isActionMessage} from "../parsers/parse-all.parser";

/**
 * Se connecte anonymement en lecture seule au chat Twitch et enregistre le
 * dernier message (en lowercase) de chaque utilisateur qui commence par un
 * ActionKeyword.
 *
 * Twitch autorise la lecture du chat IRC sans authentification (connexion
 * "justinfan"). Comme ce service ne fait que lire les messages (jamais en
 * envoyer), aucune authentification OAuth n'est nécessaire.
 *
 * Variables d'environnement :
 * - TWITCH_MOCK : si "true", ne se connecte pas réellement à Twitch (utile en dev/tests,
 *   les messages peuvent alors être injectés via TestController)
 * - TWITCH_CHANNEL : nom de la chaîne Twitch à écouter (sans le #)
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
            throw new Error("TWITCH_CHANNEL non défini : impossible de se connecter au chat Twitch.");
        }

        this.setupClient(channel);
        await this.connect();
    }

    public async onModuleDestroy(): Promise<void> {
        await this.client?.disconnect();
    }

    /**
     * Crée le client tmi.js en lecture anonyme, avec reconnexion automatique
     * gérée nativement par tmi.js (backoff exponentiel jusqu'à 30s, tentatives
     * infinies), et branche les listeners de cycle de vie de la connexion.
     */
    private setupClient(channel: string): void {
        this.client = new tmi.Client({
            options: {debug: false},
            connection: {
                reconnect: true,
                secure: true,
                reconnectDecay: 1.5,
                reconnectInterval: 1000,
                maxReconnectInterval: 30000,
                maxReconnectAttempts: Infinity,
            },
            channels: [channel],
        });

        this.client.on("message", (_channel, tags, message) => {
            const author = tags["display-name"] ?? tags.username ?? "unknown";
            this.registerMessage(author, message);
        });

        this.client.on("connected", (address, port) => {
            this.logger.log(`Connecté au chat Twitch #${channel} (${address}:${port.toString()}, anonyme)`);
        });

        this.client.on("disconnected", (reason) => {
            this.logger.warn(`Déconnecté du chat Twitch : ${reason || "raison inconnue"}. Reconnexion automatique...`);
        });

        this.client.on("reconnect", () => {
            this.logger.log("Tentative de reconnexion au chat Twitch...");
        });

        this.client.on("notice", (_channel, msgid, message) => {
            this.logger.warn(`Notice Twitch (${msgid ?? "?"}) : ${message}`);
        });
    }

    /**
     * Lance la connexion initiale. tmi.js gère seul les reconnexions
     * ultérieures (option `connection.reconnect`) ; ici on gère uniquement
     * l'échec de la toute première tentative, en réessayant indéfiniment.
     */
    private async connect(): Promise<void> {
        if (!this.client) {
            return;
        }

        while (true) {
            try {
                await this.client.connect();
                return;
            } catch (err) {
                this.logger.error(
                    `Impossible de se connecter au chat Twitch : ${(err as Error).message}. Nouvelle tentative dans 5s...`,
                );
                await new Promise<void>((resolve) => setTimeout(resolve, 5000));
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



