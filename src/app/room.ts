import { RoomState } from "~shared/room";

export type RoomConfig = {
  readonly id: string;
};

export type RoomSync =
  | {
      readonly status: "unsynced";
      readonly syncing: boolean;
    }
  | {
      readonly status: "synced";
      readonly config: RoomConfig;
      readonly state: RoomState;
    };
