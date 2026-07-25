import {Controller, Get, Param, Query} from "@nestjs/common";
import {BotService} from "src/services/bot.service";
import {parseAllParser} from "../parsers/parse-all.parser";
import {ChatAction} from "src/interfaces/chat-action";
import {GameCycleService} from "../services/game-cycle.service";
import {BotMethod} from "../interfaces/bot-request";
import {OverlaySocketService} from "../services/overlay-socket.service";
import {TwitchMessageCollectorService} from "../services/twitch-message-collector.service";
import {StreamlabsDonationCollecterService} from "../services/streamlabs-donation-collecter.service";
import {BidWarKeyword} from "../../shared/bid-war-keyword";

@Controller()
export class TestController {
    constructor(
        private readonly botService: BotService,
        private readonly gameCycle: GameCycleService,
        private readonly overlayService: OverlaySocketService,
        private readonly twitchMessageCollector: TwitchMessageCollectorService,
        private readonly bidWarService: StreamlabsDonationCollecterService,
    ) {
    }

    @Get()
    public async getState(): Promise<any> {
        return await this.botService.getCurrentState();
    }

    @Get("simulate/:message")
    public simulateMessage(@Param("message") message: string) {
        const m = message.replaceAll("_", " ");
        console.log("Message ", m);
        const parsedMessage: ChatAction | null = parseAllParser(m);
        if (parsedMessage) {
            console.log("Valid action", parsedMessage);
            this.gameCycle.registerChatAction(parsedMessage);
        } else {
            console.log("No valid action found");
        }
    }

    /**
     * Simule la réception d'un message de chat Twitch, comme s'il venait
     * réellement du chat (utilisé par command-emulation.ts en mode "twitch").
     * GET /debug/twitch/:user/:message
     */
    @Get("debug/twitch/:user/:message")
    public simulateTwitchMessage(
        @Param("user") user: string,
        @Param("message") message: string,
    ): { ok: boolean } {
        const m = message.replaceAll("_", " ");
        console.log(`Twitch message from ${user} : ${m}`);
        this.twitchMessageCollector.registerMessage(user, m);
        return {ok: true};
    }

    /**
     * Simule un don Streamlabs pour la bid war, comme si un spectateur avait
     * réellement fait un don avec ce mot-clé dans son message (utilisé par
     * command-emulation.ts, commande "don").
     * GET /debug/donation/:keyword/:amount
     */
    @Get("debug/donation/:keyword/:amount")
    public simulateDonation(
        @Param("keyword") keyword: string,
        @Param("amount") amount: string,
    ): { ok: boolean } | { error: string } {
        const num = parseFloat(amount);
        if (isNaN(num) || num < 0) {
            return {error: `Montant invalide : "${amount}"`};
        }
        const kw = Object.values(BidWarKeyword).find((k) => k === keyword.toLowerCase());
        if (!kw) {
            return {error: `Mot-clé inconnu : "${keyword}". Valeurs possibles : ${Object.values(BidWarKeyword).join(", ")}`};
        }
        console.log(`Don simulé : ${kw} ${num}`);
        this.bidWarService.simulateDonation(kw, num);
        return {ok: true};
    }

    // ── Routes de debug (dev uniquement) ─────────────────────────────────────────

    /**
     * Modifie directement une valeur de jeu via l'endpoint `set`.
     * GET /debug/set?field=<champ>&value=<entier>
     *
     * Champs supportés : money, chips, ante, round, hands, discards,
     *                    hand_size, joker_slots, consumable_slots
     */
    @Get("debug/set")
    public async debugSet(
        @Query("field") field: string,
        @Query("value") value: string,
    ): Promise<any> {
        const num = parseInt(value, 10);
        if (isNaN(num)) {
            return {error: `Valeur invalide : "${value}"`};
        }
        const allowed = [
            "money", "chips", "ante", "round", "hands", "discards",
            "hand_size", "joker_slots", "consumable_slots",
        ];
        if (!allowed.includes(field)) {
            return {error: `Champ inconnu : "${field}". Valeurs possibles : ${allowed.join(", ")}`};
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        const res = await this.botService.debugRaw(BotMethod.SET, {[field]: num});
        await this.overlayService.update();
        return res;
    }

    /**
     * Ajoute une carte par sa clé (joker, consommable, voucher ou carte à jouer).
     * GET /debug/add/:key
     *
     * Exemples de clés :
     *   Jokers      → j_joker, j_the_duo, j_chaos, ...
     *   Tarots      → c_magician, c_high_priestess, c_strength, ...
     *   Spectraux   → c_familiar, c_grim, c_incantation, ...
     *   Planètes    → c_mercury, c_venus, c_earth, ...
     *   Vouchers    → v_overstock, v_clearance_sale, ...
     */
    @Get("debug/add/:key")
    public async debugAdd(@Param("key") key: string): Promise<any> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        const res = await this.botService.debugRaw(BotMethod.ADD, {key});
        await this.overlayService.update();
        return res;
    }

    /**
     * Raccourci : définit l'argent directement.
     * GET /debug/money/:amount
     */
    @Get("debug/money/:amount")
    public async debugMoney(@Param("amount") amount: string): Promise<any> {
        const num = parseInt(amount, 10);
        if (isNaN(num) || num < 0) {
            return {error: "Montant invalide"};
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const res = await this.botService.debugRaw(BotMethod.SET, {money: num});
        await this.overlayService.update();
        return res;
    }
}
