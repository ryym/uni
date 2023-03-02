import { atom } from "jotai";
import { Room } from "~/app/room";
import { AtomInitializer, pair } from "~/views/lib/jotai";

const mutRoomAtom = atom<Room | null>(null);

export const roomAtomInitializers = (room: Room): Array<AtomInitializer<unknown>> => {
  return [pair(mutRoomAtom, room)];
};

export const roomAtom = atom((get) => {
  const room = get(mutRoomAtom);
  if (room == null) {
    throw new Error("Room atom not set");
  }
  return room;
});
