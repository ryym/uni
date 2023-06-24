import { ReactElement } from "react";
import { cardColorClasses } from "~/globalStyles";
import { DialogHandle, ModalDialog } from "~/views/lib/ModalDialog";
import { COLORS, Color } from "~shared/cards";
import styles from "./styles/ColorSelectDialog.module.css";

export type ColorSelectDialogProps = {
  readonly handle: DialogHandle;
  readonly onColorSelect: (color: Color) => void;
};

export function ColorSelectDialog(props: ColorSelectDialogProps): ReactElement {
  return (
    <ModalDialog handle={props.handle}>
      <form className={styles.colorSelectForm} action="dialog">
        <div>Choose Color</div>
        <div className={styles.colorChoiceList}>
          {COLORS.map((color) => (
            <label key={color} className={`${styles.colorChoice} ${cardColorClasses[color]}`}>
              <input
                type="radio"
                name="color"
                value={color}
                onChange={() => props.onColorSelect(color)}
              />
              <span>{color}</span>
            </label>
          ))}
        </div>
      </form>
    </ModalDialog>
  );
}
