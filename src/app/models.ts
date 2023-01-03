export type User = {
  readonly uid: string;
};

export class NoSessionError extends Error {
  constructor() {
    super("no user session found");
  }
}
