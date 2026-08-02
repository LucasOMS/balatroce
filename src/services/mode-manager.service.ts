import {Injectable, Logger, OnModuleDestroy, OnModuleInit} from "@nestjs/common";
import {Subject} from "rxjs";
import {auditTime} from "rxjs/operators";
import {io, Socket} from "socket.io-client";
import * as fs from "node:fs";
import * as path from "node:path";
import {ActionMode} from "../../shared/action-mode";
import {ModeTimerInfo} from "../../shared/mode-timer-info";

/** Un don Streamlabs tel que reçu dans le tableau `message` d'un événement "donation" */
interface StreamlabsDonationEvent {
    /** Identifiant unique du don (selon le type d'événement Streamlabs) */
    donationId?: string | number;
    charityDonationId?: string | number;
    /** Pseudo du donateur */
    from?: string;
    name?: string;
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

/** État persisté du minuteur de mode, sur disque */
interface PersistedModeState {
    mode?: ActionMode;
    phaseEndTimestamp?: number;
    donationAmount?: number;
    totalDonationAmount?: number;
    processedDonationIds?: string[];
}

const DATA_FILE = path.join(process.cwd(), "data", "mode-timer.json");
const STREAMLABS_SOCKET_URL = "https://sockets.streamlabs.com";
/** Types d'événements socket Streamlabs correspondant à un don (dons classiques et caritatifs) */
const DONATION_EVENT_TYPES = ["donation", "streamlabscharitydonation"];
/** Mode utilisé par défaut au tout premier démarrage (aucun état persisté) */
const DEFAULT_MODE = ActionMode.Democracy;

/**
 * Gère le mode de sélection des actions (démocratie / anarchie) :
 * - le mode change automatiquement au bout de `MODE_PHASE_DURATION_MS`
 * - il change immédiatement si le montant de dons cumulé depuis le dernier
 *   changement atteint `MODE_DONATION_THRESHOLD`
 * - à chaque changement, le montant de la phase est remis à 0, mais le total
 *   de dons récoltés (statistique globale) continue de s'accumuler
 *
 * Se connecte également à la socket Streamlabs pour suivre les dons en temps
 * réel. Un don est ignoré si :
 * - c'est un don de test (`isTest`), qui n'a pas d'identifiant fiable ;
 * - Streamlabs le rejoue (`repeat`), pour éviter de le comptabiliser en double ;
 * - son identifiant a déjà été traité (sécurité supplémentaire anti-doublon) ;
 * - il cible un autre streamer que celui configuré via TWITCH_CHANNEL (cas des
 *   événements multi-streamers, ex: caritatifs).
 *
 * Persiste son état (mode courant, fin de phase, montant de la phase, total
 * de dons, ids déjà traités) dans un fichier JSON, chargé au démarrage. Le
 * serveur (et même le jeu Balatro) peuvent être arrêtés/relancés au milieu
 * d'une phase sans perdre son avancement : le minuteur repose sur un
 * timestamp absolu (`phaseEndTimestamp`), jamais mis en pause.
 *
 * Variables d'environnement :
 * - MODE_PHASE_DURATION_MS : durée (ms) d'une phase avant changement
 *   automatique de mode (défaut 600000, soit 10 minutes)
 * - MODE_DONATION_THRESHOLD : montant de dons (cumulé depuis le dernier
 *   changement) déclenchant un changement de mode immédiat (défaut 50)
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
export class ModeManagerService implements OnModuleInit, OnModuleDestroy {
    static readonly PHASE_DURATION_MS = parseInt(process.env.MODE_PHASE_DURATION_MS ?? "600000", 10);
    static readonly DONATION_THRESHOLD = parseFloat(process.env.MODE_DONATION_THRESHOLD ?? "50");

    private readonly logger = new Logger(ModeManagerService.name);
    private socket: Socket | null = null;

    private mode: ActionMode = DEFAULT_MODE;
    /** Timestamp (ms, epoch) auquel la phase en cours se termine (changement automatique) */
    private phaseEndTimestamp = Date.now() + ModeManagerService.PHASE_DURATION_MS;
    /** Montant de dons cumulé depuis le dernier changement de mode */
    private donationAmount = 0;
    /** Montant total de dons récoltés depuis le début, jamais réinitialisé */
    private totalDonationAmount = 0;

    private timer: ReturnType<typeof setTimeout> | null = null;

    /** Ids des dons déjà traités, pour éviter de les comptabiliser en double */
    private readonly processedDonationIds = new Set<string>();

    /** Résolution memberId → pseudo Twitch, pour les événements multi-streamers */
    private readonly streamerLoginByMemberId = new Map<string, string>();

    private readonly changeSubject = new Subject<void>();
    /** Émet à chaque fois que l'état du minuteur de mode change (max 1 fois / seconde) */
    public readonly modeChanged$ = this.changeSubject.pipe(auditTime(1000));

    public onModuleInit(): void {
        this.loadFromDisk();
        this.loadStreamerMap();
        this.catchUpIfNeeded();
        this.scheduleTimer();

        if (process.env.STREAMLABS_MOCK === "true") {
            this.logger.warn(
                "STREAMLABS_MOCK=true : connexion Streamlabs désactivée. Utilisez /debug/donation/:amount pour simuler un don.",
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
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
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
        this.registerDonation(amount);
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
     * Enregistre un montant de don : incrémente le montant cumulé de la
     * phase en cours ainsi que le total global, puis bascule immédiatement
     * de mode si le seuil est atteint. Utilisé aussi bien par la connexion
     * Streamlabs réelle que par le mock de test.
     */
    public registerDonation(amount: number): void {
        const safeAmount = isNaN(amount) ? 0 : amount;
        this.donationAmount += safeAmount;
        this.totalDonationAmount += safeAmount;

        if (this.donationAmount >= ModeManagerService.DONATION_THRESHOLD) {
            this.switchMode();
            return;
        }

        this.saveToDisk();
        this.changeSubject.next();
    }

    /** Crédite directement un don, sans passer par Streamlabs (utilisé par le mock de debug) */
    public simulateDonation(amount: number): void {
        this.registerDonation(amount);
    }

    /** Mode actuellement actif */
    public getCurrentMode(): ActionMode {
        return this.mode;
    }

    /** Construit les informations du minuteur de mode à envoyer au front (indépendamment du reste de l'overlay) */
    public getCurrentInfo(): ModeTimerInfo {
        return {
            mode: this.mode,
            phaseEndTimestamp: this.phaseEndTimestamp,
            phaseDurationMs: ModeManagerService.PHASE_DURATION_MS,
            donationAmount: this.donationAmount,
            donationThreshold: ModeManagerService.DONATION_THRESHOLD,
            totalDonationAmount: this.totalDonationAmount,
        };
    }

    /** Bascule vers l'autre mode : remet le montant de la phase à 0 et redémarre une phase complète. */
    private switchMode(): void {
        this.mode = this.mode === ActionMode.Democracy ? ActionMode.Anarchy : ActionMode.Democracy;
        this.donationAmount = 0;
        this.phaseEndTimestamp = Date.now() + ModeManagerService.PHASE_DURATION_MS;
        this.logger.log(`Changement de mode : ${this.mode}`);

        this.saveToDisk();
        this.scheduleTimer();
        this.changeSubject.next();
    }

    /** (Re)programme le timer de changement automatique de mode sur `phaseEndTimestamp`. */
    private scheduleTimer(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        const delay = Math.max(0, this.phaseEndTimestamp - Date.now());
        this.timer = setTimeout(() => this.switchMode(), delay);
    }

    /**
     * Si le serveur a été arrêté plus longtemps que le temps restant de la
     * phase en cours (ou que le jeu a coupé net pendant ce temps), la phase
     * est considérée comme terminée : on bascule immédiatement de mode au
     * redémarrage plutôt que d'essayer de rattraper plusieurs changements
     * manqués (un seul rattrapage suffit, le principal étant de ne jamais
     * mettre le minuteur en pause).
     */
    private catchUpIfNeeded(): void {
        if (this.phaseEndTimestamp > Date.now()) {
            return;
        }
        this.mode = this.mode === ActionMode.Democracy ? ActionMode.Anarchy : ActionMode.Democracy;
        this.donationAmount = 0;
        this.phaseEndTimestamp = Date.now() + ModeManagerService.PHASE_DURATION_MS;
        this.logger.log(`Rattrapage au démarrage : changement de mode : ${this.mode}`);
        this.saveToDisk();
    }

    private loadFromDisk(): void {
        try {
            if (!fs.existsSync(DATA_FILE)) {
                return;
            }
            const raw = fs.readFileSync(DATA_FILE, "utf-8");
            const parsed = JSON.parse(raw) as PersistedModeState;
            this.mode = parsed.mode === ActionMode.Anarchy || parsed.mode === ActionMode.Democracy ? parsed.mode : DEFAULT_MODE;
            this.phaseEndTimestamp = parsed.phaseEndTimestamp ?? Date.now() + ModeManagerService.PHASE_DURATION_MS;
            this.donationAmount = parsed.donationAmount ?? 0;
            this.totalDonationAmount = parsed.totalDonationAmount ?? 0;
            for (const id of parsed.processedDonationIds ?? []) {
                this.processedDonationIds.add(id);
            }
            this.logger.log(`État du minuteur de mode chargé depuis ${DATA_FILE}`);
        } catch (err) {
            this.logger.warn(`Impossible de charger l'état du minuteur de mode : ${(err as Error).message}`);
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
            const state: PersistedModeState = {
                mode: this.mode,
                phaseEndTimestamp: this.phaseEndTimestamp,
                donationAmount: this.donationAmount,
                totalDonationAmount: this.totalDonationAmount,
                processedDonationIds: [...this.processedDonationIds],
            };
            fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
        } catch (err) {
            this.logger.warn(`Impossible de sauvegarder l'état du minuteur de mode : ${(err as Error).message}`);
        }
    }
}


