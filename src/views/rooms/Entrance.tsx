import { ReactElement, useState } from "react";

export type EntranceProps = {
  readonly joinRoom: (userName: string) => unknown;
  readonly joining: boolean;
};

export function Entrance(props: EntranceProps): ReactElement {
  const [userName, setUserName] = useState("");
  return (
    <div>
      {props.joining && "joining..."}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          props.joinRoom(userName);
        }}
      >
        <label>
          user name
          <input
            disabled={props.joining}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </label>
      </form>
    </div>
  );
}
