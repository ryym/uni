export type RoomState = {
  readonly createdAt: number;
  readonly ownerUid: string;
  readonly members: RoomMemberMap;
};

export type RoomMemberMap = {
  readonly [uid: string]: RoomMember;
};

export type RoomMember = {
  readonly name: string;
};
