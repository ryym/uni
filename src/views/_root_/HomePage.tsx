import { FormEvent, ReactElement, useState } from "react";
import { useLocation } from "wouter";
import { useCreateRoom } from "./useCreateRoom";

export function HomePage(): ReactElement {
  const [, navigate] = useLocation();
  const createRoom = useCreateRoom();

  const [masterPassword, setMasterPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newRoom = await createRoom(masterPassword);
    navigate(`/rooms/${newRoom.id}`);
  };

  return (
    <div>
      <h2>Join room</h2>
      <p>Ask the room owner for the room URL.</p>
      <hr />

      <h2>Create room</h2>
      <form onSubmit={handleSubmit}>
        <label>
          master password
          <input
            type="password"
            required
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
          />
        </label>
        <p>Currently this application is open for limited users.</p>
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
