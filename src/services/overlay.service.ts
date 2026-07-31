import {Injectable} from "@nestjs/common";
import {BotService} from "./bot.service";
import {OverlayInfo} from "../../shared/overlay-info";
import {ActionKeyword} from "../../shared/action-keyword";
import {GameCycleState} from "../../shared/game-cycle-state";
import {GameState} from "@shared/game-state";
import {GameWatchdogService} from "./game-watchdog.service";

/**
 * Responsable de constituer les informations de l'overlay
 * en interrogeant le bot pour obtenir l'état courant du jeu.
 */
@Injectable()
export class OverlayService {
    constructor(
        private readonly botService: BotService,
        private readonly gameWatchdogService: GameWatchdogService,
    ) {
    }

    async getCurrentInfo(): Promise<OverlayInfo> {
        if (this.gameWatchdogService.isRestarting()) {
            return {
                availableActions: [],
                restarting: true,
                restartMessage: GameWatchdogService.RESTART_MESSAGE,
            };
        }

        const gameState = await this.botService.getCurrentState();
        return {
            step: gameState.state,
            availableActions: this.getAvailableActions(gameState),
            gameState,
            restarting: false,
        };
    }

    private getAvailableActions(state: GameState): ActionKeyword[] {
        let res: ActionKeyword[] = [];

        // Certains états (ex: MENU) ne renvoient pas ces champs : on protège l'accès.
        const jokerCount = state.jokers?.count ?? 0;
        const consumableCount = state.consumables?.count ?? 0;

        const hasJoker = jokerCount > 0;
        const canRearrangeJoker = jokerCount > 1;

        const hasConsumable = consumableCount > 0;
        const canRearrangeConsumable = consumableCount > 1;

        const jokerActions: ActionKeyword[] = [
            hasJoker ? ActionKeyword.SellJoker : undefined,
            canRearrangeJoker ? ActionKeyword.RearrangeJokers : undefined,
        ].filter(v => !!v);

        const consumableActions: ActionKeyword[] = [
            hasConsumable ? ActionKeyword.SellConsumable : undefined,
            canRearrangeConsumable ? ActionKeyword.RearrangeConsumables : undefined,
            hasConsumable ? ActionKeyword.UseConsumable : undefined,
        ].filter(v => !!v);

        switch (state.state) {
            case GameCycleState.MENU:
                res = [ActionKeyword.StartRun];
                break;
            case GameCycleState.BLIND_SELECT:
                res = [
                    ActionKeyword.SelectBlind,
                    ActionKeyword.SkipBlind,
                    ...jokerActions,
                    ...consumableActions,
                ];
                break;
            case GameCycleState.SELECTING_HAND:
                const canDiscard = (state.round?.discards_left ?? 0) > 0;

                res = [
                    ActionKeyword.Play,
                    canDiscard ? ActionKeyword.Discard : undefined,
                    ActionKeyword.RearrangeHand,
                    ...jokerActions,
                    ...consumableActions,
                ].filter(v => !!v);
                break;
            case GameCycleState.ROUND_EVAL:
                // Round eval should be auto
                res = [];
                break;
            case GameCycleState.SHOP:
                res = [
                    ActionKeyword.BuyCard,
                    ActionKeyword.BuyVoucher,
                    ActionKeyword.BuyPack,
                    ActionKeyword.Reroll,
                    ActionKeyword.NextRound,
                    ...jokerActions,
                    ...consumableActions,
                ];
                break;
            case GameCycleState.SMODS_BOOSTER_OPENED:
                res = [
                    ActionKeyword.PackSelect,
                    ActionKeyword.PackSkip,
                    ...jokerActions,
                    ...consumableActions,
                ];
                break;

            case GameCycleState.GAME_OVER:
                res = [];
                break;

        }
        return res;
    }
}
