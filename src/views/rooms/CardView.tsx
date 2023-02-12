import { ReactElement } from "react";
import { Card } from "~shared/cards";

export type CardViewProps = {
  readonly card: Card;
};

export function CardView(props: CardViewProps): ReactElement {
  switch (props.card.type) {
    case "Number": {
      return <span style={{ color: props.card.color }}>Number {props.card.value}</span>;
    }
    case "Reverse": {
      return <span style={{ color: props.card.color }}>Reverse</span>;
    }
    case "Skip": {
      return <span style={{ color: props.card.color }}>Skip</span>;
    }
    case "Draw2": {
      return <span style={{ color: props.card.color }}>Draw2</span>;
    }
    case "Wild": {
      return <span>Wild</span>;
    }
    case "Draw4": {
      return <span>Draw4</span>;
    }
  }
}
