import { RoomState } from "~shared/room";

export type Room = {
  readonly id: string;
};

export type SyncedRoom =
  | {
      readonly status: "unsynced";
    }
  | {
      readonly status: "synced";
      readonly room: Room;
      readonly state: RoomState;
    };