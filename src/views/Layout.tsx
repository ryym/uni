import { ReactElement, ReactNode } from "react";
import { Link } from "wouter";
import styles from "./styles/Layout.module.css";

export type LayoutProps = {
  readonly children: ReactNode;
};

export function Layout(props: LayoutProps): ReactElement {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link href="/">
          <a>
            <h1 className={styles.title}>Uni</h1>
          </a>
        </Link>
      </header>
      <main className={styles.main}>{props.children}</main>
    </div>
  );
}
