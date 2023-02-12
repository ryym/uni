import { ReactElement } from "react";

export type InvalidGameProps = {
  readonly message: string;
};

export function InvalidGame(props: InvalidGameProps): ReactElement {
  return (
    <div>
      <div>ERROR: unexpected game state</div>
      <div>{props.message}</div>
    </div>
  );
}
