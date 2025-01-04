import { Realtime } from "./realtime";
export class Kadoa {
  private teamApiKey?: string;
  private _realtime?: Realtime;

  constructor(props: IKadoaProps) {
    if (!props.apiKey && !props.teamApiKey) {
      throw new Error("apiKey or teamApiKey must be passed");
    }
    this.teamApiKey = props.teamApiKey;
  }

  get realtime() {
    if (!this._realtime) {
      this._realtime = new Realtime(this.teamApiKey);
    }
    return this._realtime;
  }
}
