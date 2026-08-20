import {PerformedAction, PerformedActionType, PlayingCardSnapshot,} from "@shared/performed-action";

export type PlayingCardColor = "red" | "black";

export type PerformedActionDisplayPart =
  | { kind: "text"; text: string }
  | {
  kind: "playing-card";
  rank: string;
  suit: string;
  color: PlayingCardColor;
};

const SUITS: Record<string, { symbol: string; color: PlayingCardColor }> = {
  H: {symbol: "♥", color: "red"},
  D: {symbol: "♦", color: "red"},
  C: {symbol: "♣", color: "black"},
  S: {symbol: "♠", color: "black"},
};

export function formatPerformedAction(action: PerformedAction): PerformedActionDisplayPart[] {
  switch (action.type) {
    case PerformedActionType.SELECT_BLIND:
      return text("Sélectionner la blinde");
    case PerformedActionType.SKIP_BLIND:
      return text("Passer la blinde");
    case PerformedActionType.REROLL:
      return text("Relancer le magasin");
    case PerformedActionType.NEXT_ROUND:
      return text("Passer");
    case PerformedActionType.START_RUN:
      return text("Commencer une partie");
    case PerformedActionType.PACK_SKIP:
      return text("Passer le pack");
    case PerformedActionType.PLAY:
      return withPlayingCards("Jouer ", action.cards);
    case PerformedActionType.DISCARD:
      return withPlayingCards("Défausser ", action.cards);
    case PerformedActionType.REARRANGE_HAND:
      return withPlayingCards("Réorganiser la main : ", action.cards);
    case PerformedActionType.SELL_JOKER:
    case PerformedActionType.SELL_CONSUMABLE:
      return text(`Vendre ${action.item.label}`);
    case PerformedActionType.USE_CONSUMABLE:
      return action.cards.length > 0
        ? [
          {kind: "text", text: `Utiliser ${action.item.label} sur `},
          ...playingCards(action.cards),
        ]
        : text(`Utiliser ${action.item.label}`);
    case PerformedActionType.REARRANGE_JOKERS:
      return text(`Réorganiser les jokers : ${action.items.map((item) => item.label).join(", ")}`);
    case PerformedActionType.REARRANGE_CONSUMABLES:
      return text(`Réorganiser les consommables : ${action.items.map((item) => item.label).join(", ")}`);
    case PerformedActionType.BUY_CARD:
      return text(`Acheter ${action.item.label}`);
    case PerformedActionType.BUY_VOUCHER:
      return text(`Acheter le coupon ${action.item.label}`);
    case PerformedActionType.BUY_PACK:
      return text(`Acheter ${action.item.label}`);
    case PerformedActionType.PACK_SELECT:
      return action.cards.length > 0
        ? [
          {kind: "text", text: `Choisir ${action.item.label} sur `},
          ...playingCards(action.cards),
        ]
        : text(`Choisir ${action.item.label}`);
  }
}

function text(value: string): PerformedActionDisplayPart[] {
  return [{kind: "text", text: value}];
}

function withPlayingCards(prefix: string, cards: PlayingCardSnapshot[]): PerformedActionDisplayPart[] {
  return [{kind: "text", text: prefix}, ...playingCards(cards)];
}

function playingCards(cards: PlayingCardSnapshot[]): PerformedActionDisplayPart[] {
  return cards.flatMap((card, index) => {
    const suit = SUITS[card.suit.toUpperCase()];
    const separator: PerformedActionDisplayPart[] = index === 0 ? [] : [{kind: "text", text: " "}];

    if (!suit || !card.rank) {
      return [...separator, {kind: "text", text: card.label} as PerformedActionDisplayPart];
    }

    return [
      ...separator,
      {
        kind: "playing-card",
        rank: card.rank.toUpperCase() === "T" ? "10" : card.rank.toUpperCase(),
        suit: suit.symbol,
        color: suit.color,
      } as PerformedActionDisplayPart,
    ];
  });
}
