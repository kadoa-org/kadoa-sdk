import { WSS_API_URI, REALTIME_API_URI, PUBLIC_API_URI } from "./constants";
import { WebSocket } from "ws";

export class Realtime {
  private socket?: WebSocket;
  private heartbeatInterval: number = 10000; // 10 seconds
  private reconnectDelay: number = 5000; // 5 seconds
  private lastHeartbeat: number = Date.now();
  private isConnecting: boolean = false;
  private missedHeartbeatsLimit: number = 30000; // 30 seconds without heartbeat
  private missedHeartbeatCheckTimer?: ReturnType<typeof setInterval>;
  private teamApiKey?: string;
  private handleEvent: (event: any) => void = () => {};

  constructor(teamApiKey?: string) {
    if (!teamApiKey) {
      throw new Error("teamApiKey is required for Realtime connection");
    }
    this.teamApiKey = teamApiKey;
  }

  private async connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const response = await fetch(`${PUBLIC_API_URI}/v4/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.teamApiKey}`,
        },
      });

      const { access_token, team_id } = await response.json();

      this.socket = new WebSocket(
        `${WSS_API_URI}?access_token=${access_token}`,
      );

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.lastHeartbeat = Date.now();

        if (this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(
            JSON.stringify({
              action: "subscribe",
              channel: team_id,
            }),
          );
          console.log("Connected");
        }
        this.startHeartbeatCheck();
      };

      this.socket.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "heartbeat") {
            this.handleHeartbeat();
          } else {
            if (data?.id) {
              fetch(`${REALTIME_API_URI}/api/v1/events/ack`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: data.id }),
              });
            }
            this.handleEvent(data);
          }
        } catch (err) {
          console.error("Failed to parse incoming message:", err);
        }
      };

      this.socket.onclose = () => {
        console.warn("Disconnected. Attempting to reconnect...");
        this.isConnecting = false;
        this.stopHeartbeatCheck();
        setTimeout(() => this.connect(), this.reconnectDelay);
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.isConnecting = false;
      };
    } catch (err) {
      console.error("Failed to connect:", err);
      this.isConnecting = false;
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  private handleHeartbeat() {
    console.log("Heartbeat received");
    this.lastHeartbeat = Date.now();
  }

  private startHeartbeatCheck() {
    this.missedHeartbeatCheckTimer = setInterval(() => {
      if (Date.now() - this.lastHeartbeat > this.missedHeartbeatsLimit) {
        console.error(
          "No heartbeat received in 30 seconds! Closing connection.",
        );
        this.socket?.close();
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeatCheck() {
    if (this.missedHeartbeatCheckTimer) {
      clearInterval(this.missedHeartbeatCheckTimer);
    }
  }

  public listen(callback: (event: any) => void) {
    this.handleEvent = callback;
    this.connect();
  }
}
