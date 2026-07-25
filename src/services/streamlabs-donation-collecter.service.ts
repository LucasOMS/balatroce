import {Injectable, Logger, OnModuleDestroy, OnModuleInit} from "@nestjs/common";
import {Subject} from "rxjs";
import {auditTime} from "rxjs/operators";
import {io, Socket} from "socket.io-client";
import * as fs from "node:fs";
import * as path from "node:path";
import {BidWarKeyword} from "../../shared/bid-war-keyword";
import {BidWarInfo} from "../../shared/bid-war-info";

/** Un don Streamlabs tel que reçu dans le tableau `message` d'un événement "donation" */
interface StreamlabsDonationEvent {
    /** Identifiant unique du don (selon le type d'événement Streamlabs) */
    donationId?: string | number;
    charityDonationId?: string | number;
    /** Pseudo du donateur */
    from?: string;
    name?: string;
    /** Message du don, dans lequel on cherche les BidWarKeyword */
    message?: string;
    amount?: number | string;
    /** true pour les dons de test envoyés depuis le dashboard Streamlabs : pas d'id fiable, à ignorer */
    isTest?: boolean;
    /** true si Streamlabs rejoue un événement déjà envoyé : à ignorer pour éviter les doublons */
    repeat?: boolean;
    /** Identifiant du streamer ciblé par le don (utilisé pour les événements multi-streamers, ex: caritatifs) */
    memberId?: string;
    /** Pseudo Twitch du streamer ciblé, si déjà résolu par Streamlabs */
    to?: string;
}

interface StreamlabsSocketEvent {
    type: string;
    message: StreamlabsDonationEvent[];
}

const DATA_FILE = path.join(process.cwd(), "data", "bid-war.json");
const STREAMLABS_SOCKET_URL = "https://sockets.streamlabs.com";
/** Types d'événements socket Streamlabs correspondant à un don (dons classiques et caritatifs) */
const DONATION_EVENT_TYPES = ["donation", "streamlabscharitydonation"];

/**
 * Se connecte à la socket Streamlabs pour suivre les dons et les comptabiliser
 * comme des votes pour l'une des deux stratégies de la bid war (démocratie /
 * anarchie), en fonction des BidWarKeyword présents dans le message du don.
 *
 * Si le message contient les deux mots-clés, le don est ignoré.
 *
 * Un don est également ignoré si :
 * - c'est un don de test (`isTest`), qui n'a pas d'identifiant fiable ;
 * - Streamlabs le rejoue (`repeat`), pour éviter de le comptabiliser en double ;
 * - son identifiant a déjà été traité (sécurité supplémentaire anti-doublon) ;
 * - il cible un autre streamer que celui configuré via TWITCH_CHANNEL (cas des
 *   événements multi-streamers, ex: caritatifs).
 *
 * Persiste son état (scores + nombre de dons + ids déjà traités) dans un
 * fichier JSON, chargé au démarrage.
 *
 * Variables d'environnement :
 * - STREAMLABS_MOCK : si "true", ne se connecte pas réellement à Streamlabs
 *   (utile en dev/tests, les dons peuvent alors être injectés via TestController)
 * - STREAMLABS_SOCKET_TOKEN : token de connexion à la socket Streamlabs
 *   (obligatoire si STREAMLABS_MOCK n'est pas "true", sinon le serveur ne démarre pas)
 * - TWITCH_CHANNEL : si défini, seuls les dons ciblant ce pseudo Twitch (résolu
 *   via `donation.to` ou la table STREAMLABS_STREAMER_MAP) sont comptabilisés.
 *   Si la cible du don ne peut pas être déterminée, il est comptabilisé par défaut.
 * - STREAMLABS_STREAMER_MAP : JSON optionnel `{ "<memberId>": "<pseudoTwitch>" }`
 *   pour résoudre le pseudo Twitch ciblé par un don à partir de son `memberId`
 *   (nécessaire pour les événements multi-streamers, ex: caritatifs).
 */
@Injectable()
export class StreamlabsDonationCollecterService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(StreamlabsDonationCollecterService.name);
    private socket: Socket | null = null;

    private readonly scores: Record<BidWarKeyword, number> = {
        [BidWarKeyword.Democracy]: 0,
        [BidWarKeyword.Anarchy]: 0,
    };
    private donationCount = 0;

    /** Ids des dons déjà traités, pour éviter de les comptabiliser en double */
    private readonly processedDonationIds = new Set<string>();

    /** Résolution memberId → pseudo Twitch, pour les événements multi-streamers */
    private readonly streamerLoginByMemberId = new Map<string, string>();

    private readonly changeSubject = new Subject<void>();
    /** Émet à chaque fois que la bid war change (max 1 fois / seconde) */
    public readonly bidWarChanged$ = this.changeSubject.pipe(auditTime(1000));

    public onModuleInit(): void {
        this.loadFromDisk();
        this.loadStreamerMap();

        if (process.env.STREAMLABS_MOCK === "true") {
            this.logger.warn(
                "STREAMLABS_MOCK=true : connexion Streamlabs désactivée. Utilisez /debug/donation/:keyword/:amount pour simuler un don.",
            );
            return;
        }

        const token = process.env.STREAMLABS_SOCKET_TOKEN;
        if (!token) {
            throw new Error(
                "STREAMLABS_SOCKET_TOKEN non défini : impossible de se connecter à la socket Streamlabs.",
            );
        }

        this.connect(token);
    }

    public onModuleDestroy(): void {
        try {
            this.socket?.disconnect();
        } catch (err) {
            this.logger.warn(`Erreur lors de la déconnexion de la socket Streamlabs : ${(err as Error).message}`);
        }
    }

    /**
     * Ouvre la connexion à la socket Streamlabs. La reconnexion automatique
     * (backoff exponentiel, tentatives infinies) est gérée nativement par
     * socket.io-client ; on se contente ici de logger le cycle de vie de la
     * connexion. Tous les listeners sont défensifs (try/catch) pour qu'une
     * erreur de traitement d'un don ne puisse jamais faire planter le serveur.
     */
    private connect(token: string): void {
        this.socket = io(`${STREAMLABS_SOCKET_URL}?token=${token}`, {
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000,
            randomizationFactor: 0.5,
        });

        this.socket.on("connect", () => {
            this.logger.log("Connecté à la socket Streamlabs");
        });

        this.socket.on("disconnect", (reason: string) => {
            this.logger.warn(`Déconnecté de la socket Streamlabs : ${reason}. Reconnexion automatique...`);
        });

        this.socket.on("connect_error", (err: Error) => {
            this.logger.error(`Erreur de connexion à la socket Streamlabs : ${err.message}`);
        });

        this.socket.on("error", (err: Error) => {
            // Erreur générique côté socket.io (ne doit jamais remonter en exception non gérée)
            this.logger.error(`Erreur socket Streamlabs : ${err?.message ?? String(err)}`);
        });

        this.socket.io.on("reconnect_attempt", (attempt: number) => {
            this.logger.log(`Tentative de reconnexion à la socket Streamlabs (#${attempt.toString()})...`);
        });

        this.socket.io.on("reconnect", (attempt: number) => {
            this.logger.log(`Reconnecté à la socket Streamlabs après ${attempt.toString()} tentative(s)`);
        });

        this.socket.on("event", (data: StreamlabsSocketEvent) => {
            try {
                if (!DONATION_EVENT_TYPES.includes(data.type) || !Array.isArray(data.message)) {
                    return;
                }
                for (const donation of data.message) {
                    try {
                        this.handleIncomingDonation(donation);
                    } catch (err) {
                        // Un don malformé ne doit jamais interrompre le traitement des autres,
                        // ni faire planter le serveur.
                        this.logger.error(`Erreur lors du traitement d'un don Streamlabs : ${(err as Error).message}`);
                    }
                }
            } catch (err) {
                this.logger.error(`Erreur lors du traitement d'un événement Streamlabs : ${(err as Error).message}`);
            }
        });
    }

    /**
     * Filtre puis enregistre un don brut reçu de Streamlabs (ou simulé) :
     * ignore les dons de test, les rejeux (`repeat`), les doublons déjà
     * traités, et les dons ne ciblant pas le streamer configuré via
     * TWITCH_CHANNEL.
     */
    private handleIncomingDonation(donation: StreamlabsDonationEvent): void {
        if (donation.isTest) {
            // Les dons de test n'ont pas d'id fiable, on les ignore
            return;
        }

        if (donation.repeat) {
            // Streamlabs peut rejouer un don déjà envoyé : on l'ignore pour éviter les doublons
            return;
        }

        const donationId = donation.charityDonationId ?? donation.donationId;
        if (donationId !== undefined) {
            const key = String(donationId);
            if (this.processedDonationIds.has(key)) {
                return;
            }
            this.processedDonationIds.add(key);
        }

        if (!this.isForConfiguredChannel(donation)) {
            return;
        }

        const amount = typeof donation.amount === "string" ? parseFloat(donation.amount) : donation.amount ?? 0;
        this.registerDonation(donation.message ?? "", amount);
    }

    /**
     * Vérifie que le don cible bien le streamer configuré (TWITCH_CHANNEL).
     * Si aucun filtrage n'est configuré, ou si la cible du don ne peut pas
     * être déterminée, le don est accepté par défaut.
     */
    private isForConfiguredChannel(donation: StreamlabsDonationEvent): boolean {
        const targetChannel = process.env.TWITCH_CHANNEL?.toLowerCase();
        if (!targetChannel) {
            return true;
        }

        const resolvedLogin = donation.to ?? (donation.memberId ? this.streamerLoginByMemberId.get(donation.memberId) : undefined);
        if (!resolvedLogin) {
            return true;
        }

        return resolvedLogin.toLowerCase() === targetChannel;
    }

    /**
     * Enregistre un don à partir de son message : vérifie s'il contient l'un
     * des BidWarKeyword. Si les deux sont présents (ou aucun), le don est
     * ignoré. Utilisé aussi bien par la connexion Streamlabs réelle que par
     * le mock de test.
     */
    public registerDonation(message: string, amount: number): void {
        const lower = message.toLowerCase();
        const hasDemocracy = lower.includes(BidWarKeyword.Democracy);
        const hasAnarchy = lower.includes(BidWarKeyword.Anarchy);

        if (hasDemocracy === hasAnarchy) {
            // Aucun mot-clé, ou les deux à la fois : don ignoré
            return;
        }

        this.applyDonation(hasDemocracy ? BidWarKeyword.Democracy : BidWarKeyword.Anarchy, amount);
    }

    /** Crédite directement un montant à une stratégie, sans recherche de mot-clé (utilisé par le mock de debug) */
    public simulateDonation(keyword: BidWarKeyword, amount: number): void {
        this.applyDonation(keyword, amount);
    }

    /** Stratégie actuellement en tête (démocratie par défaut en cas d'égalité) */
    public getLeadingKeyword(): BidWarKeyword {
        return this.scores[BidWarKeyword.Anarchy] > this.scores[BidWarKeyword.Democracy]
            ? BidWarKeyword.Anarchy
            : BidWarKeyword.Democracy;
    }

    /** Construit les informations de bid war à envoyer au front (indépendamment du reste de l'overlay) */
    public getCurrentInfo(): BidWarInfo {
        return {
            scores: {...this.scores},
            totalAmount: this.scores[BidWarKeyword.Democracy] + this.scores[BidWarKeyword.Anarchy],
            donationCount: this.donationCount,
        };
    }

    private applyDonation(keyword: BidWarKeyword, amount: number): void {
        this.scores[keyword] += isNaN(amount) ? 0 : amount;
        this.donationCount++;

        this.saveToDisk();
        this.changeSubject.next();
    }

    private loadFromDisk(): void {
        try {
            if (!fs.existsSync(DATA_FILE)) {
                return;
            }
            const raw = fs.readFileSync(DATA_FILE, "utf-8");
            const parsed = JSON.parse(raw) as {
                scores?: Partial<Record<BidWarKeyword, number>>;
                donationCount?: number;
                processedDonationIds?: string[];
            };
            this.scores[BidWarKeyword.Democracy] = parsed.scores?.[BidWarKeyword.Democracy] ?? 0;
            this.scores[BidWarKeyword.Anarchy] = parsed.scores?.[BidWarKeyword.Anarchy] ?? 0;
            this.donationCount = parsed.donationCount ?? 0;
            for (const id of parsed.processedDonationIds ?? []) {
                this.processedDonationIds.add(id);
            }
            this.logger.log(`Bid war chargée depuis ${DATA_FILE}`);
        } catch (err) {
            this.logger.warn(`Impossible de charger la bid war : ${(err as Error).message}`);
        }
    }

    /** Charge la table de résolution memberId → pseudo Twitch depuis STREAMLABS_STREAMER_MAP (JSON) */
    private loadStreamerMap(): void {
        const raw = process.env.STREAMLABS_STREAMER_MAP;
        if (!raw) {
            return;
        }
        try {
            const parsed = JSON.parse(raw) as Record<string, string>;
            for (const [memberId, login] of Object.entries(parsed)) {
                this.streamerLoginByMemberId.set(memberId, login);
            }
        } catch (err) {
            this.logger.warn(`STREAMLABS_STREAMER_MAP invalide (JSON attendu) : ${(err as Error).message}`);
        }
    }

    private saveToDisk(): void {
        try {
            fs.mkdirSync(path.dirname(DATA_FILE), {recursive: true});
            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(
                    {
                        scores: this.scores,
                        donationCount: this.donationCount,
                        processedDonationIds: [...this.processedDonationIds],
                    },
                    null,
                    2,
                ),
                "utf-8",
            );
        } catch (err) {
            this.logger.warn(`Impossible de sauvegarder la bid war : ${(err as Error).message}`);
        }
    }
}







