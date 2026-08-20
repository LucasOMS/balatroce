import {PerformedAction, PerformedActionType} from "@shared/performed-action";

export type PlayingCardColor = "red" | "black";

export type PerformedActionDisplayPart =
  | {kind: "text"; text: string}
  | {
      kind: "playing-card";
      rank: string;
      suit: string;
      color: PlayingCardColor;
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
  }
}

function text(value: string): PerformedActionDisplayPart[] {
  return [{kind: "text", text: value}];
}
