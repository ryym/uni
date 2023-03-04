import { ReactElement, ReactNode } from "react";
import styles from "./styles/Layout.module.css";

export type LayoutProps = {
  readonly children: ReactNode;
};

export function Layout(props: LayoutProps): ReactElement {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Uni</h1>
      </header>
      <main className={styles.main}>{props.children}</main>
    </div>
  );
}
