import { ReactElement } from "react";

export type NoGameProps = {
  readonly onStartGame: () => unknown;
};

export function NoGame(props: NoGameProps): ReactElement {
  return (
    <div>
      <div>no game</div>
      <button onClick={props.onStartGame}>Start Game</button>
    </div>
  );
}
