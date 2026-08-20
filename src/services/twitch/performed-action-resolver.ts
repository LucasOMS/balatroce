import {
  GameItemSnapshot,
  PerformedAction,
  PerformedActionType,
  PlayingCardSnapshot,
} from "../../../shared/performed-action";
import {ChatAction} from "../../interfaces/chat-action";
import {BotMethod} from "../../interfaces/bot-request";
import {Card, GameState} from "../../interfaces/game-state";

const RANK_VALUES: Record<string, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

/**
 * Orders cards for the Play action so the poker combination reads naturally:
 * grouped ranks first (trips before pairs, pairs before kickers), then high
 * cards. A wheel straight is displayed 5-4-3-2-A.
 */
export function orderPlayedCards(cards: PlayingCardSnapshot[]): PlayingCardSnapshot[] {
  const indexedCards = cards.map((card, index) => ({card, index}));
  const rankCounts = new Map<string, number>();

  for (const {card} of indexedCards) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) ?? 0) + 1);
  }

  const hasGroupedRanks = [...rankCounts.values()].some((count) => count > 1);
  const rankValues = cards.map((card) => rankValue(card.rank));
  const isWheel =
    cards.length === 5 &&
    new Set(rankValues).size === 5 &&
    [2, 3, 4, 5, 14].every((rank) => rankValues.includes(rank));

  return indexedCards
    .sort((left, right) => {
      if (hasGroupedRanks) {
        const countDifference =
          (rankCounts.get(right.card.rank) ?? 0) -
          (rankCounts.get(left.card.rank) ?? 0);
        if (countDifference !== 0) {
          return countDifference;
        }
      }

      const leftRank = isWheel && rankValue(left.card.rank) === 14 ? 1 : rankValue(left.card.rank);
      const rightRank = isWheel && rankValue(right.card.rank) === 14 ? 1 : rankValue(right.card.rank);
      const rankDifference = rightRank - leftRank;
      return rankDifference !== 0 ? rankDifference : left.index - right.index;
    })
    .map(({card}) => card);
}

/**
 * Builds a semantic description from the exact game state used to validate the
 * action. Index-based commands are therefore resolved before the game mutates.
 */
export function resolvePerformedAction(
  action: ChatAction,
  previousState: GameState,
): PerformedAction | null {
  switch (action.method) {
    case BotMethod.SELECT:
      return {type: PerformedActionType.SELECT_BLIND};
    case BotMethod.SKIP:
      return {type: PerformedActionType.SKIP_BLIND};
    case BotMethod.REROLL:
      return {type: PerformedActionType.REROLL};
    case BotMethod.NEXT_ROUND:
      return {type: PerformedActionType.NEXT_ROUND};
    case BotMethod.START:
      return {type: PerformedActionType.START_RUN};
    case BotMethod.PLAY:
      return {
        type: PerformedActionType.PLAY,
        cards: orderPlayedCards(snapshotPlayingCards(previousState.hand.cards, action.params.cards)),
      };
    case BotMethod.DISCARD:
      return {
        type: PerformedActionType.DISCARD,
        cards: snapshotPlayingCards(previousState.hand.cards, action.params.cards),
      };
    case BotMethod.REARRANGE:
      if ("hand" in action.params) {
        return {
          type: PerformedActionType.REARRANGE_HAND,
          cards: snapshotPlayingCards(previousState.hand.cards, action.params.hand),
        };
      }
      if ("jokers" in action.params) {
        return {
          type: PerformedActionType.REARRANGE_JOKERS,
          items: snapshotItems(previousState.jokers.cards, action.params.jokers),
        };
      }
      return {
        type: PerformedActionType.REARRANGE_CONSUMABLES,
        items: snapshotItems(previousState.consumables.cards, action.params.consumables),
      };
    case BotMethod.SELL:
      if ("joker" in action.params) {
        const item = snapshotItem(previousState.jokers.cards[action.params.joker]);
        return item ? {type: PerformedActionType.SELL_JOKER, item} : null;
      }
      const consumable = snapshotItem(previousState.consumables.cards[action.params.consumable]);
      return consumable ? {type: PerformedActionType.SELL_CONSUMABLE, item: consumable} : null;
    case BotMethod.USE: {
      const item = snapshotItem(previousState.consumables.cards[action.params.consumable]);
      if (!item) {
        return null;
      }
      return {
        type: PerformedActionType.USE_CONSUMABLE,
        item,
        cards: snapshotPlayingCards(previousState.hand.cards, action.params.cards ?? []),
      };
    }
    case BotMethod.BUY:
      if ("card" in action.params) {
        const item = snapshotItem(previousState.shop.cards[action.params.card]);
        return item ? {type: PerformedActionType.BUY_CARD, item} : null;
      }
      if ("voucher" in action.params) {
        const item = snapshotItem(previousState.vouchers.cards[action.params.voucher]);
        return item ? {type: PerformedActionType.BUY_VOUCHER, item} : null;
      }
      const pack = snapshotItem(previousState.packs.cards[action.params.pack]);
      return pack ? {type: PerformedActionType.BUY_PACK, item: pack} : null;
    case BotMethod.PACK:
      if ("skip" in action.params) {
        return {type: PerformedActionType.PACK_SKIP};
      }
      if (!previousState.pack) {
        return null;
      }
      const item = snapshotItem(previousState.pack.cards[action.params.card]);
      if (!item) {
        return null;
      }
      return {
        type: PerformedActionType.PACK_SELECT,
        item,
        cards: snapshotPlayingCards(previousState.hand.cards, action.params.targets ?? []),
      };
    default:
      return null;
  }
}

function snapshotPlayingCards(cards: Card[], indexes: number[]): PlayingCardSnapshot[] {
  return indexes.flatMap((index) => {
    const card = cards[index];
    return card ? [snapshotPlayingCard(card)] : [];
  });
}

function snapshotItems(cards: Card[], indexes: number[]): GameItemSnapshot[] {
  return indexes.flatMap((index) => {
    const item = snapshotItem(cards[index]);
    return item ? [item] : [];
  });
}

function snapshotPlayingCard(card: Card): PlayingCardSnapshot {
  return {
    rank: card.value.rank ?? "",
    suit: card.value.suit ?? "",
    label: card.label,
  };
}

function snapshotItem(card: Card | undefined): GameItemSnapshot | null {
  return card ? {label: card.label} : null;
}

function rankValue(rank: string): number {
  return RANK_VALUES[rank.toUpperCase()] ?? 0;
}
