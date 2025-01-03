export interface IKadoaProps {
  apiKey?: string;
  teamApiKey?: string;
}

const WSS_API_URI = process.env.WSS_KADOA_API_URI ?? "wss://realtime.kadoa.com";
const PUBLIC_API_URI =
  process.env.PUBLIC_KADOA_API_URI ?? "https://api.kadoa.com";

export class Kadoa {
  private teamApiKey?: string;
  private socket?: WebSocket;
  private heartbeatInterval: number = 10000; // 10 seconds
  private reconnectDelay: number = 5000; // 5 seconds
  private lastHeartbeat: number = Date.now();
  private isConnecting: boolean = false; // Prevent concurrent connections
  private missedHeartbeatsLimit: number = 30000; // 30 seconds without heartbeat
  private missedHeartbeatCheckTimer?: NodeJS.Timeout;

  constructor(props: IKadoaProps) {
    if (!props.apiKey && !props.teamApiKey) {
      throw new Error("apiKey or teamApiKey must be passed");
    }
    this.teamApiKey = props.teamApiKey;
  }

  private async connect() {
    if (this.isConnecting) {
      return; // Prevent multiple simultaneous connection attempts
    }
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
        this.lastHeartbeat = Date.now(); // Reset heartbeat time

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

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "heartbeat") {
            this.handleHeartbeat(data);
          } else {
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

  private handleHeartbeat(data) {
    console.log("Heartbeat received", data);
    this.lastHeartbeat = Date.now();
  }

  private handleEvent(event: any) {
    console.log("Event received:", event);
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
