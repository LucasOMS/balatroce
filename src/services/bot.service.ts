import {Injectable, Logger} from "@nestjs/common";
import {BotHttpService} from "./bot-http.service";
import {StartRunAction} from "../interfaces/actions/start-run.action";
import {Deck} from "../enums/deck.enum";
import {Stake} from "../enums/stake.enum";
import {CardIndexes} from "../types/card-indexes.type";
import {PlayAction} from "../interfaces/actions/play-or-discard.action";
import {DiscardAction} from "../interfaces/actions/discard.action";
import {
    RearrangeConsumablesAction,
    RearrangeHandAction,
    RearrangeJokersAction,
} from "../interfaces/actions/rearrange-consumables.action";
import {SellConsumableAction, SellJokerAction} from "../interfaces/actions/sell-consumable.action";
import {SelectBlindAction, SkipBlindAction} from "../interfaces/actions/skip-or-select-blind.action";
import {UseConsumableAction} from "../interfaces/actions/use-consumable.action";
import {
    BuyCardAction,
    BuyPackAction,
    BuyVoucherAction,
    NextRoundAction,
    RerollAction
} from "../interfaces/actions/shop.action";
import {GameState} from "../interfaces/game-state";
import {ChatAction} from "../interfaces/chat-action";
import {BotMethod} from "../interfaces/bot-request";

@Injectable()
export class BotService {

    constructor(
        private readonly httpService: BotHttpService,
        private readonly logger: Logger,
    ) {
    }

    public async getCurrentState(): Promise<GameState> {
        return await this.httpService.sendRequest<GameState>({
            method: BotMethod.GAMESTATE,
        });
    }

    public startRun() {
        this.logger.log("Starting a run");
        const startRun: StartRunAction = {
            method: BotMethod.START,
            params: {
                stake: Stake.WHITE,
                deck: Deck.RED,
            },
        };
        return this.httpService.sendRequest(startRun);
    }

    public async goToMenu(): Promise<any> {
        this.logger.log("Return to menu");
        return await this.httpService.sendRequest({
            method: BotMethod.MENU,
        });
    }

    public play(cards: CardIndexes) {
        this.logger.log("Play cards ", cards);
        const playAction: PlayAction = {
            method: BotMethod.PLAY,
            params: {cards},
        };
        return this.httpService.sendRequest(playAction);
    }

    public discard(cards: CardIndexes) {
        this.logger.log("Discard cards ", cards);
        const discardAction: DiscardAction = {
            method: BotMethod.DISCARD,
            params: {cards},
        };
        return this.httpService.sendRequest(discardAction);
    }

    public rearrangeConsumables(order: CardIndexes) {
        this.logger.log("Rearrange consumables; new order :", order);
        const action: RearrangeConsumablesAction = {
            method: BotMethod.REARRANGE,
            params: {consumables: order},
        };
        return this.httpService.sendRequest(action);
    }

    public rearrangeHand(order: CardIndexes) {
        this.logger.log("Rearrange hand; new order :", order);
        const action: RearrangeHandAction = {
            method: BotMethod.REARRANGE,
            params: {hand: order},
        };
        return this.httpService.sendRequest(action);
    }

    public rearrangeJokers(order: CardIndexes) {
        this.logger.log("Rearrange jokers; new order :", order);
        const action: RearrangeJokersAction = {
            method: BotMethod.REARRANGE,
            params: {jokers: order},
        };
        return this.httpService.sendRequest(action);
    }

    /** @param index 0-based */
    public sellConsumable(index: number) {
        this.logger.log("Sell consumable at index :", index);
        const action: SellConsumableAction = {
            method: BotMethod.SELL,
            params: {consumable: index},
        };
        return this.httpService.sendRequest(action);
    }

    /** @param index 0-based */
    public sellJoker(index: number) {
        this.logger.log("Sell joker at index :", index);
        const action: SellJokerAction = {
            method: BotMethod.SELL,
            params: {joker: index},
        };
        return this.httpService.sendRequest(action);
    }

    public skipBlind() {
        this.logger.log("Skip blind");
        const action: SkipBlindAction = {
            method: BotMethod.SKIP,
        };
        return this.httpService.sendRequest(action);
    }

    public selectBlind() {
        this.logger.log("Select blind");
        const action: SelectBlindAction = {
            method: BotMethod.SELECT,
        };
        return this.httpService.sendRequest(action);
    }

    /** @param index 0-based */
    public useConsumable(index: number) {
        this.logger.log("Use consumable at index :", index);
        const action: UseConsumableAction = {
            method: BotMethod.USE,
            params: {consumable: index},
        };
        return this.httpService.sendRequest(action);
    }

    public cashOut() {
        this.logger.log("Cash Out");
        return this.httpService.sendRequest({method: BotMethod.CASH_OUT});
    }

    async useRaw(msg: ChatAction): Promise<any> {
        return await this.httpService.sendRequest(msg);
    }

    public shopActions = {
        buyCard: (index: number) => {
            this.logger.log("Buy card at index :", index);
            const action: BuyCardAction = {
                method: BotMethod.BUY,
                params: {card: index},
            };
            return this.httpService.sendRequest(action);
        },
        buyVoucher: (index: number) => {
            this.logger.log("Buy voucher at index :", index);
            const action: BuyVoucherAction = {
                method: BotMethod.BUY,
                params: {voucher: index},
            };
            return this.httpService.sendRequest(action);
        },
        buyPack: (index: number) => {
            this.logger.log("Buy pack at index :", index);
            const action: BuyPackAction = {
                method: BotMethod.BUY,
                params: {pack: index},
            };
            return this.httpService.sendRequest(action);
        },
        reroll: () => {
            this.logger.log("Reroll shop");
            const action: RerollAction = {
                method: BotMethod.REROLL,
            };
            return this.httpService.sendRequest(action);
        },
        nextRound: () => {
            this.logger.log("Exit shop to next round");
            const action: NextRoundAction = {
                method: BotMethod.NEXT_ROUND,
            };
            return this.httpService.sendRequest(action);
        },
    };

    public awaitInit(): Promise<void> {
        return this.httpService.awaitInit();
    }
}
