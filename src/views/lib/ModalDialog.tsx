import { MouseEvent, ReactElement, ReactNode, RefObject, useMemo, useRef } from "react";
import styles from "./styles/ModalDialog.module.css";

export type ModalDialogProps = {
  readonly handle: DialogHandle;
  readonly children: ReactNode;
};

export function ModalDialog(props: ModalDialogProps): ReactElement {
  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === props.handle.ref.current) {
      props.handle.close();
    }
  };
  return (
    <dialog className={styles.root} ref={props.handle.ref} onClick={onBackdropClick}>
      {props.children}
    </dialog>
  );
}

export type DialogHandle = {
  readonly ref: RefObject<HTMLDialogElement>;
  readonly showModal: () => void;
  readonly close: () => void;
};

export const useDialog = (): DialogHandle => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const getDialogElement = (ref: typeof dialogRef) => {
    if (ref.current == null) {
      throw new Error("[uni][useDialog] dialog ref must be set");
    }
    return ref.current;
  };

  const handle: DialogHandle = useMemo(() => {
    return Object.freeze({
      ref: dialogRef,
      showModal: () => getDialogElement(dialogRef).showModal(),
      close: () => getDialogElement(dialogRef).close(),
    });
  }, [dialogRef]);

  return handle;
};
