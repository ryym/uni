import { ReactElement } from "react";
import { cardColorClasses } from "~/globalStyles";
import { Card } from "~shared/cards";
import styles from "./styles/CardView.module.css";

export type CardViewProps = {
  readonly card: CardViewType;
  readonly size?: CardViewSize;
  readonly floating?: boolean;
  readonly focused?: boolean;
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
    <div
      className={[
        styles.card,
        sizeClass,
        props.floating ? styles.cardFloating : "",
        props.focused ? styles.cardFocused : "",
      ].join(" ")}
    >
      <CardViewContent card={props.card} />
    </div>
  );
}

function CardViewContent({ card }: CardViewProps): ReactElement {
  if (card === "hidden") {
    return <div className={styles.hidden}>uni</div>;
  }
  switch (card.type) {
    case "Number": {
      return (
        <div className={`${styles.character} ${cardColorClasses[card.color]}`}>{card.value}</div>
      );
    }

    case "Reverse": {
      return <div className={`${styles.character} ${cardColorClasses[card.color]}`}>R</div>;
    }

    case "Skip": {
      return <div className={`${styles.character} ${cardColorClasses[card.color]}`}>S</div>;
    }

    case "Draw2": {
      return (
        <div className={`${styles.draw2} ${cardColorClasses[card.color]}`}>
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
            <div className={cardColorClasses.Green} style={{ top: "16%", left: "12%" }} />
            <div className={cardColorClasses.Yellow} style={{ top: "24%", left: "24%" }} />
            <div className={cardColorClasses.Blue} style={{ top: "32%", left: "36%" }} />
            <div className={cardColorClasses.Red} style={{ top: "40%", left: "48%" }} />
          </div>
          +4
        </div>
      );
    }

    case "Wild": {
      return (
        <div className={styles.wild}>
          <div className={styles.wildSymbol}>
            <div className={cardColorClasses.Red} />
            <div className={cardColorClasses.Blue} />
            <div className={cardColorClasses.Green} />
            <div className={cardColorClasses.Yellow} />
          </div>
        </div>
      );
    }
  }
}
