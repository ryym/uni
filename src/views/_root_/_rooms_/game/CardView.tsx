import { ReactElement } from "react";
import { Card, Color } from "~shared/cards";
import styles from "./styles/CardView.module.css";

export type CardViewProps = {
  readonly card: CardViewType;
  readonly size?: CardViewSize;
  readonly shadow?: boolean;
};

export type CardViewType = "hidden" | Card;

const cardSizeClasses = Object.freeze({
  sm: styles.cardSmall,
  md: styles.cardMedium,
});

export type CardViewSize = keyof typeof cardSizeClasses;

export function CardView(props: CardViewProps): ReactElement {
  const sizeClass = cardSizeClasses[props.size || "md"];
  return (
    <div className={`${styles.card} ${sizeClass} ${props.shadow ? styles.cardShadow : ""}`}>
      <CardViewContent card={props.card} />
    </div>
  );
}

const colorClasses = {
  Red: styles.cardRed,
  Blue: styles.cardBlue,
  Green: styles.cardGreen,
  Yellow: styles.cardYellow,
} satisfies Record<Color, string>;

function CardViewContent({ card }: CardViewProps): ReactElement {
  if (card === "hidden") {
    return <div className={styles.hidden}>uni</div>;
  }
  switch (card.type) {
    case "Number": {
      return <div className={`${styles.character} ${colorClasses[card.color]}`}>{card.value}</div>;
    }

    case "Reverse": {
      return <div className={`${styles.character} ${colorClasses[card.color]}`}>R</div>;
    }

    case "Skip": {
      return <div className={`${styles.character} ${colorClasses[card.color]}`}>S</div>;
    }

    case "Draw2": {
      return (
        <div className={`${styles.draw2} ${colorClasses[card.color]}`}>
          <div className={styles.draw2Symbol}>
            <div style={{ top: "18%", left: "18%" }} />
            <div style={{ top: "34%", left: "38%" }} />
          </div>
          +2
        </div>
      );
    }

    case "Draw4": {
      return (
        <div className={styles.draw4}>
          <div className={styles.draw4Symbol}>
            <div className={colorClasses.Green} style={{ top: "16%", left: "12%" }} />
            <div className={colorClasses.Yellow} style={{ top: "24%", left: "24%" }} />
            <div className={colorClasses.Blue} style={{ top: "32%", left: "36%" }} />
            <div className={colorClasses.Red} style={{ top: "40%", left: "48%" }} />
          </div>
          +4
        </div>
      );
    }

    case "Wild": {
      return (
        <div className={styles.wild}>
          <div className={styles.wildSymbol}>
            <div className={colorClasses.Red} />
            <div className={colorClasses.Blue} />
            <div className={colorClasses.Green} />
            <div className={colorClasses.Yellow} />
          </div>
        </div>
      );
    }
  }
}
