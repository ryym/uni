import { RoomState } from "~shared/room";

export type SyncedRoom =
  | {
      readonly status: "unsynced";
    }
  | {
      readonly status: "synced";
      readonly state: RoomState;
    };
