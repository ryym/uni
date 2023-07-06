export type InitGameParams = {
  readonly roomId: string;
};

export type InitGameResult = {
  error: string | null;
};

export type CancelGameParams = {
  readonly roomId: string;
};

export type CancelGameResult = {
  error: string | null;
};
