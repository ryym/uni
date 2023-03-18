import { atom } from "jotai";
import { RoomConfig } from "~/app/room";
import { AtomInitializer, pair } from "~/views/lib/jotai";

const mutRoomConfigAtom = atom<RoomConfig | null>(null);

export const roomConfigAtomInitializers = (
  roomConfig: RoomConfig,
): Array<AtomInitializer<unknown>> => {
  return [pair(mutRoomConfigAtom, roomConfig)];
};

export const roomConfigAtom = atom((get) => {
  const room = get(mutRoomConfigAtom);
  if (room == null) {
    throw new Error("Room atom not set");
  }
  return room;
});
