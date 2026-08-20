import {PerformedActionType, PlayingCardSnapshot} from "../../../shared/performed-action";
import {BotMethod} from "../../interfaces/bot-request";
import {Card, GameState} from "../../interfaces/game-state";
import {orderPlayedCards, resolvePerformedAction} from "./performed-action-resolver";

describe("performed action resolver", () => {
  it("groups the played pair before kickers and sorts kickers by rank", () => {
    const ordered = orderPlayedCards([
      playingCard("5", "D"),
      playingCard("A", "C"),
      playingCard("5", "H"),
      playingCard("T", "S"),
      playingCard("2", "C"),
    ]);

    expect(ordered.map((card) => card.rank)).toEqual(["5", "5", "A", "T", "2"]);
  });

  it("displays an ace-low straight as 5-4-3-2-A", () => {
    const ordered = orderPlayedCards([
      playingCard("A", "S"),
      playingCard("3", "D"),
      playingCard("5", "C"),
      playingCard("2", "H"),
      playingCard("4", "S"),
    ]);

    expect(ordered.map((card) => card.rank)).toEqual(["5", "4", "3", "2", "A"]);
  });

  it("resolves played card indexes against the previous hand", () => {
    const previousState = gameState({
      hand: [card("Ace of Clubs", "A", "C"), card("10 of Hearts", "T", "H"), card("5 of Diamonds", "5", "D")],
    });

    const result = resolvePerformedAction(
      {method: BotMethod.PLAY, params: {cards: [0, 1, 2]}},
      previousState,
    );

    expect(result).toEqual({
      type: PerformedActionType.PLAY,
      cards: [
        {rank: "A", suit: "C", label: "Ace of Clubs"},
        {rank: "T", suit: "H", label: "10 of Hearts"},
        {rank: "5", suit: "D", label: "5 of Diamonds"},
      ],
    });
  });

  it("snapshots the purchased item label from the previous shop", () => {
    const previousState = gameState({shop: [card("Joker", "", "")]});

    const result = resolvePerformedAction(
      {method: BotMethod.BUY, params: {card: 0}},
      previousState,
    );

    expect(result).toEqual({
      type: PerformedActionType.BUY_CARD,
      item: {label: "Joker"},
    });
  });
});

function playingCard(rank: string, suit: string): PlayingCardSnapshot {
  return {rank, suit, label: `${rank}${suit}`};
}

function card(label: string, rank: string, suit: string): Card {
  return {
    label,
    value: {rank, suit},
  } as Card;
}

function gameState(overrides: {hand?: Card[]; shop?: Card[]}): GameState {
  return {
    hand: {cards: overrides.hand ?? []},
    shop: {cards: overrides.shop ?? []},
    jokers: {cards: []},
    consumables: {cards: []},
    vouchers: {cards: []},
    packs: {cards: []},
    pack: null,
  } as unknown as GameState;
}
