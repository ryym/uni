import { ReactElement, useState } from "react";

export type EntranceProps = {
  readonly joinRoom: (userName: string) => unknown;
};

export function Entrance(props: EntranceProps): ReactElement {
  const [userName, setUserName] = useState("");
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          props.joinRoom(userName);
        }}
      >
        <label>
          user name
          <input value={userName} onChange={(e) => setUserName(e.target.value)} />
        </label>
      </form>
    </div>
  );
}
