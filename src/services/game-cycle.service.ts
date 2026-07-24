import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {CardSet, GameCycleState, GameState} from "src/interfaces/game-state";
import {BotService} from "./bot.service";
import {firstValueFrom, Subject} from "rxjs";
import {ChatAction} from "../interfaces/chat-action";
import {BotMethod} from "../interfaces/bot-request";
import {PlayAction} from "../interfaces/actions/play-or-discard.action";
import {DiscardAction} from "../interfaces/actions/discard.action";
import {RearrangeAction} from "../interfaces/actions/rearrange-consumables.action";
import {UseConsumableAction} from "../interfaces/actions/use-consumable.action";
import {SellConsumableAction, SellJokerAction} from "../interfaces/actions/sell-consumable.action";
import {BuyAction} from "../interfaces/actions/shop.action";
import {OverlaySocketService} from "./overlay-socket.service";
import {TwitchActionDeciderService} from "./twitch-action-decider.service";

@Injectable()
export class GameCycleService implements OnModuleInit {
    private currentGameState: GameState;
    private readonly actionsSubject = new Subject<ChatAction>();

    constructor(
        private readonly botService: BotService,
        private readonly logger: Logger,
        private readonly overlaySocketService: OverlaySocketService,
        private readonly twitchActionDecider: TwitchActionDeciderService,
    ) {
    }

    public async onModuleInit(): Promise<void> {
        await this.botService.awaitInit();
        this.currentGameState = await this.botService.getCurrentState();

        this.twitchActionDecider.actionsResult$.subscribe((actions) => {
            this.registerChatActions(actions);
        });
        this.twitchActionDecider.startTimer();

        // Start steps without waiting because await would lock the module init
        void this.nextStep();
    }

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
                const playAction = action as PlayAction;
                const cardCount = playAction.params.cards.length;
                if (cardCount <= 0 || cardCount > 5) {
                    return false;
                }
                break;
            }
            case BotMethod.DISCARD: {
                const discardAction = action as DiscardAction;
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
                const rearrangeAction = action as RearrangeAction;
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
                const useAction = action as UseConsumableAction;
                if (useAction.params.consumable > consumableCount - 1) {
                    return false;
                }
                break;
            }
            case BotMethod.SELL: {
                if ("consumable" in action.params!) {
                    const sellConsumableAction = action as SellConsumableAction;
                    if (sellConsumableAction.params.consumable > consumableCount - 1) {
                        return false;
                    }
                } else if ("joker" in action.params!) {
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

    public registerChatAction(request: ChatAction) {
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
    public registerChatActions(actions: ChatAction[]): void {
        const validAction = actions.find((action) => this.isActionValid(action));
        if (!validAction) {
            this.logger.warn("Aucune action valide parmi les résultats du vote : ", actions);
            return;
        }
        this.actionsSubject.next(validAction);
    }

    private async nextStep() {
        let didAutoAction = false;
        do {
            didAutoAction = false;
            this.currentGameState = await this.botService.getCurrentState();
            switch (this.currentGameState.state) {
                case GameCycleState.GAME_OVER:
                    await this.botService.goToMenu();
                    didAutoAction = true;
                    break;

                case GameCycleState.MENU:
                    await this.botService.startRun();
                    didAutoAction = true;
                    break;

                case GameCycleState.ROUND_EVAL:
                    await this.botService.cashOut();
                    didAutoAction = true;
                    break;
            }
            console.log('New game cycle state : ', this.currentGameState.state);
        } while (didAutoAction);

        await this.overlaySocketService.update();

        this.logger.log("Attente d'une action");
        const action = await firstValueFrom(this.actionsSubject.asObservable());
        await this.botService.useRaw(action);

        this.currentGameState = await this.botService.getCurrentState();
        console.log('New game cycle state : ', this.currentGameState.state);

        await this.nextStep();
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
