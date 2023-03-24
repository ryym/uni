import { Component, ReactElement, ReactNode } from "react";
import { Layout } from "./Layout";

export type ErrorBoundaryProps = {
  readonly children: ReactNode;
};

type State = {
  readonly error: unknown | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  override render(): ReactElement | ReactNode {
    if (this.state.error == null) {
      return this.props.children;
    }
    return (
      <Layout>
        <p>予期せぬエラーが発生しました。</p>

        {/* Use native anchor tag instead of router's Link, to initialize whole app state. */}
        <a href="/">ホームへ戻る</a>
      </Layout>
    );
  }
}
