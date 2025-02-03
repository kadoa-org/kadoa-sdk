import { Realtime } from "./realtime";

export class Kadoa {
  private _realtime?: Realtime;

  constructor(private teamApiKey?: string) {
    if (!teamApiKey) {
      throw new Error("teamApiKey must be provided");
    }
  }

  get realtime() {
    return this._realtime ??= new Realtime(this.teamApiKey);
  }
}

export * from "./types";
