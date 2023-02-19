export type RoomState = {
  readonly createdAt: number;
  readonly ownerUid: string;
  readonly members: {
    readonly [uid: string]: {
      readonly name: string;
    };
  };
};
