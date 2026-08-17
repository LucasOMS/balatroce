import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {CardSet, GameCycleState, GameState} from "src/interfaces/game-state";
import {BotService} from "./bot.service";
import {filter, firstValueFrom, race, Subject, switchMap, throwError} from "rxjs";
import {ChatAction} from "../interfaces/chat-action";
import {BotMethod} from "../interfaces/bot-request";
import {SellConsumableAction, SellJokerAction} from "../interfaces/actions/sell-consumable.action";
import {BuyAction} from "../interfaces/actions/shop.action";
import {OverlaySocketService} from "./overlay-socket.service";
import {TwitchActionDeciderService} from "./twitch-action-decider.service";
import {GameWatchdogService} from "./game-watchdog.service";
import {AutosaveService} from "./autosave.service";
import {ProgressionService} from "./progression.service";
import {AnnouncementService} from "./announcement.service";

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class GameCycleService implements OnModuleInit {
    /** Délai (ms) avant de retenter après une erreur non liée à une relance en cours */
    private static readonly RETRY_DELAY_MS = 2000;

    /** Message affiché sur l'overlay lorsqu'un deck est terminé avec succès */
    private static readonly WIN_MESSAGE = "Partie gagnée ! Bravo";
    /** Durée (ms) d'affichage du message de victoire avant de passer au deck suivant */
    private static readonly WIN_MESSAGE_DURATION_MS = 5000;

    private currentGameState: GameState;
    private readonly actionsSubject = new Subject<ChatAction>();

    constructor(
        private readonly botService: BotService,
        private readonly logger: Logger,
        private readonly overlaySocketService: OverlaySocketService,
        private readonly twitchActionDecider: TwitchActionDeciderService,
        private readonly gameWatchdogService: GameWatchdogService,
        private readonly autosaveService: AutosaveService,
        private readonly progressionService: ProgressionService,
        private readonly announcementService: AnnouncementService,
    ) {
    }

    public async onModuleInit(): Promise<void> {
        await this.botService.awaitInit();
        this.currentGameState = await this.botService.getCurrentState();

        this.twitchActionDecider.actionsResult$.subscribe((actions) => {
            void this.registerChatActions(actions);
        });
        this.twitchActionDecider.startTimer();

        // Start steps without waiting because await would lock the module init
        void this.nextStep();
    }

    /**
     * Valide une action par rapport à l'état de jeu actuel (mis en cache).
     *
     * Le cache (`this.currentGameState`) doit être rafraîchi par l'appelant
     * juste avant d'utiliser cette méthode (voir `registerChatAction` /
     * `registerChatActions`), pour éviter les problèmes d'asynchronisme entre
     * l'état réel du jeu et l'état en cache côté serveur, tout en évitant de
     * refaire un appel réseau à chaque action vérifiée.
     */
    public isActionValid(action: ChatAction): boolean {
        let validMethods: BotMethod[] = [];
        switch (this.currentGameState.state) {
            case GameCycleState.GAME_OVER:
                validMethods = [BotMethod.MENU];
                break;
            case GameCycleState.ROUND_EVAL:
                validMethods = [
                    BotMethod.CASH_OUT,
                    BotMethod.SELL,
                    BotMethod.USE,
                    BotMethod.REARRANGE,
                ];
                break;
            case GameCycleState.BLIND_SELECT:
                validMethods = [
                    BotMethod.SELECT,
                    BotMethod.SKIP,
                    BotMethod.SELL,
                    BotMethod.USE,
                    BotMethod.REARRANGE,
                ];
                break;
            case GameCycleState.MENU:
                validMethods = [BotMethod.START];
                break;
            case GameCycleState.SELECTING_HAND:
                validMethods = [
                    BotMethod.PLAY,
                    BotMethod.DISCARD,
                    BotMethod.REARRANGE,
                    BotMethod.SELL,
                    BotMethod.USE,
                ];
                break;
            case GameCycleState.SHOP:
                validMethods = [
                    BotMethod.BUY,
                    BotMethod.REROLL,
                    BotMethod.NEXT_ROUND,
                    BotMethod.SELL,
                    BotMethod.USE,
                    BotMethod.REARRANGE,
                ];
                break;
            case GameCycleState.SMODS_BOOSTER_OPENED:
                validMethods = [BotMethod.PACK, BotMethod.REARRANGE];
                break;
        }

        if (validMethods.every((m) => m !== action.method)) {
            console.warn('Try to use action that is not valid in current state : ', action, 'current state : ', this.currentGameState.state);
            return false;
        }

        const consumableCount = this.currentGameState.consumables.count;
        const handSize = this.currentGameState.hand.count;
        const jokerCount = this.currentGameState.jokers.count;
        const discardLeft = this.currentGameState.round.discards_left;
        const dollars = this.currentGameState.money;

        const jokerEmptySlotCount =
            this.currentGameState.jokers.limit - this.currentGameState.jokers.count;
        const consumableEmptySlotCount =
            this.currentGameState.consumables.limit -
            this.currentGameState.consumables.count;

        switch (action.method) {
            case BotMethod.PLAY: {
                const playAction = action;
                const cardCount = playAction.params.cards.length;
                if (cardCount <= 0 || cardCount > 5) {
                    return false;
                }
                break;
            }
            case BotMethod.DISCARD: {
                const discardAction = action;
                const cardCount = discardAction.params.cards.length;
                if (cardCount <= 0) {
                    return false;
                }
                if (discardLeft === 0) {
                    return false;
                }
                break;
            }
            case BotMethod.REARRANGE: {
                const rearrangeAction = action;
                if ("hand" in rearrangeAction.params) {
                    if (!validateIndexes(handSize, rearrangeAction.params.hand)) {
                        return false;
                    }
                } else if ("jokers" in rearrangeAction.params) {
                    if (!validateIndexes(jokerCount, rearrangeAction.params.jokers)) {
                        return false;
                    }
                } else if ("consumables" in rearrangeAction.params) {
                    if (
                        !validateIndexes(
                            consumableCount,
                            rearrangeAction.params.consumables,
                        )
                    ) {
                        return false;
                    }
                }
                break;
            }
            case BotMethod.USE: {
                const useAction = action;
                if (useAction.params.consumable > consumableCount - 1) {
                    return false;
                }
                break;
            }
            case BotMethod.SELL: {
                if ("consumable" in action.params) {
                    const sellConsumableAction = action as SellConsumableAction;
                    if (sellConsumableAction.params.consumable > consumableCount - 1) {
                        return false;
                    }
                } else if ("joker" in action.params) {
                    const sellJokerAction = action as SellJokerAction;
                    if (sellJokerAction.params.joker > jokerCount - 1) {
                        return false;
                    }
                }
                break;
            }
            case BotMethod.BUY: {
                const buyAction = action as BuyAction;
                if ("card" in buyAction.params) {
                    const shopCards = this.currentGameState.shop.cards;
                    const index = buyAction.params.card;
                    if (index >= shopCards.length) {
                        return false;
                    }
                    const card = shopCards[index];
                    if (dollars < card.cost.buy) {
                        return false;
                    }
                    if (card.set === CardSet.JOKER && jokerEmptySlotCount <= 0) {
                        return false;
                    }
                    if (card.set !== CardSet.JOKER && consumableEmptySlotCount === 0) {
                        return false;
                    }
                } else if ("voucher" in buyAction.params) {
                    const vouchers = this.currentGameState.vouchers.cards;
                    const index = buyAction.params.voucher;
                    if (index >= vouchers.length) {
                        return false;
                    }
                    if (dollars < vouchers[index].cost.buy) {
                        return false;
                    }
                } else if ("pack" in buyAction.params) {
                    const packs = this.currentGameState.packs.cards;
                    const index = buyAction.params.pack;
                    if (index >= packs.length) {
                        return false;
                    }
                    if (dollars < packs[index].cost.buy) {
                        return false;
                    }
                }
                break;
            }
            case BotMethod.REROLL: {
                if (this.currentGameState.round.reroll_cost > dollars) {
                    return false;
                }
                break;
            }
        }

        return true;
    }

    public async registerChatAction(request: ChatAction): Promise<void> {
        // Rafraîchit le cache une seule fois, juste avant la validation, pour
        // éviter d'utiliser un état obsolète sans multiplier les appels réseau.
        this.currentGameState = await this.botService.getCurrentState();
        if (!this.isActionValid(request)) {
            this.logger.warn("Try to use an invalid chat action : ", request);
            return;
        }
        this.actionsSubject.next(request);
    }

    /**
     * Reçoit la liste des actions décidées par le vote Twitch Plays (ordonnée
     * de la plus préférée à la moins préférée) et enregistre la première qui
     * est valide dans l'état de jeu courant.
     */
    public async registerChatActions(actions: ChatAction[]): Promise<void> {
        // Rafraîchit le cache une seule fois, juste avant la validation, pour
        // éviter d'utiliser un état obsolète sans multiplier les appels réseau.
        this.currentGameState = await this.botService.getCurrentState();
        const validAction = actions.find((action) => this.isActionValid(action));
        if (!validAction) {
            this.logger.warn("Aucune action valide parmi les résultats du vote : ", actions);
            return;
        }
        this.actionsSubject.next(validAction);
    }

    /**
     * Boucle principale du cycle de jeu. Ne doit jamais se terminer ni lever
     * d'exception : toute erreur (communication coupée, jeu qui plante, etc.)
     * est interceptée, journalisée, puis on retente après avoir attendu que
     * le {@link GameWatchdogService} confirme que le jeu répond de nouveau
     * (ou après un court délai si aucune relance n'est en cours).
     */
    private async nextStep(): Promise<void> {
        while (true) {
            try {
                await this.runStep();
            } catch (err) {
                this.logger.warn(
                    `Erreur pendant le cycle de jeu, nouvelle tentative : ${(err as Error).message}`,
                );
                if (this.gameWatchdogService.isRestarting()) {
                    await this.gameWatchdogService.awaitHealthy();
                } else {
                    await sleep(GameCycleService.RETRY_DELAY_MS);
                }
            }
        }
    }

    /** Exécute une itération du cycle de jeu. Peut lever une exception. */
    private async runStep(): Promise<void> {
        let didAutoAction = false;
        do {
            didAutoAction = false;
            this.currentGameState = await this.botService.getCurrentState();
            switch (this.currentGameState.state) {
                case GameCycleState.GAME_OVER:
                    if (this.currentGameState.won) {
                        // Le deck en cours est gagné : on affiche un message de
                        // félicitations sur l'overlay quelques secondes puis on
                        // passe au deck/difficulté suivant(e) avant de repartir.
                        await this.announcementService.announce(
                            GameCycleService.WIN_MESSAGE,
                            GameCycleService.WIN_MESSAGE_DURATION_MS,
                        );
                        this.progressionService.advance();
                    }
                    await this.botService.goToMenu();
                    // La run est terminée : plus besoin de la sauvegarde automatique.
                    this.autosaveService.clear();
                    didAutoAction = true;
                    break;

                case GameCycleState.MENU:
                    // Solution de repli : normalement la reprise après une relance
                    // est gérée directement par GameWatchdogService.restartGame()
                    // (voir autosaveService.loadIfPresent() là-bas), mais on
                    // couvre aussi le cas où MENU serait atteint sans être passé
                    // par une relance détectée par le watchdog.
                    if (!(await this.autosaveService.loadIfPresent())) {
                        const {deck, stake} = this.progressionService.getCurrent();
                        await this.botService.startRun(deck, stake);
                    }
                    didAutoAction = true;
                    break;

                case GameCycleState.ROUND_EVAL:
                    await this.botService.cashOut();
                    didAutoAction = true;
                    break;
            }
            console.log('New game cycle state : ', this.currentGameState.state);
            await this.autosaveService.trySave(this.currentGameState);
        } while (didAutoAction);

        await this.overlaySocketService.update();

        this.logger.log("Attente d'une action");
        const action = await this.waitForNextAction();
        await this.botService.useRaw(action);

        this.currentGameState = await this.botService.getCurrentState();
        console.log('New game cycle state : ', this.currentGameState.state);
        await this.autosaveService.trySave(this.currentGameState);
    }

    /**
     * Attend la prochaine action à exécuter, mais abandonne immédiatement
     * cette attente si une relance du jeu démarre entre-temps (le jeu a
     * planté / ne répond plus). Sans cette interruption, si le cycle de jeu
     * est bloqué ici en attente d'une action au moment du plantage, il ne
     * repasserait jamais par la logique de reprise de partie tant qu'aucune
     * nouvelle action n'arrive (et le timer de vote est justement mis en
     * pause pendant la relance, donc aucune action n'arriverait jamais).
     */
    private waitForNextAction(): Promise<ChatAction> {
        const restartInterrupt$ = this.gameWatchdogService.restarting$.pipe(
            filter((restarting) => restarting),
            switchMap(() =>
                throwError(
                    () => new Error("Relance du jeu détectée : abandon de l'attente d'une action"),
                ),
            ),
        );
        return firstValueFrom(race(this.actionsSubject.asObservable(), restartInterrupt$));
    }
}

/**
 * Validates that an array has the given length
 * and contains exactly all numbers from 0 to length-1
 * @param length The expected length of the array
 * @param arr The array to validate
 * @returns true if valid, false otherwise
 */
function validateIndexes(length: number, arr: number[]): boolean {
    if (arr.length !== length) {
        return false;
    }

    // Create a Set of the array to remove duplicates
    const uniqueNumbers = new Set(arr);

    // Check that each number from 0 to length-1 is present
    for (let i = 0; i < length; i++) {
        if (!uniqueNumbers.has(i)) {
            return false;
        }
    }

    return true;
}
