import os
import json
import time
import threading
import websocket
import requests

WSS_API_URI = os.getenv("WSS_KADOA_API_URI", "wss://realtime.kadoa.com")
PUBLIC_API_URI = os.getenv("PUBLIC_KADOA_API_URI", "https://api.kadoa.com")
REALTIME_API_URI = os.getenv("REALTIME_KADOA_API_URI", "https://realtime.kadoa.com")

class Realtime:
    def __init__(self, team_api_key):
        if not team_api_key:
            raise ValueError("teamApiKey is required for Realtime connection")

        self.team_api_key = team_api_key
        self.socket = None
        self.heartbeat_interval = 10  # seconds
        self.reconnect_delay = 5  # seconds
        self.last_heartbeat = time.time()
        self.is_connecting = False
        self.missed_heartbeats_limit = 30  # seconds
        self.missed_heartbeat_check_timer = None
        self.handle_event = None
        self.team_id = None

    def connect(self):
        if self.is_connecting:
            return

        self.is_connecting = True

        try:
            response = requests.post(
                f"{PUBLIC_API_URI}/v4/oauth2/token",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.team_api_key}",
                },
            )

            response_data = response.json()
            access_token = response_data.get("access_token")
            self.team_id = response_data.get("team_id")

            self.socket = websocket.WebSocketApp(
                f"{WSS_API_URI}?access_token={access_token}",
                on_open=self.on_open,
                on_message=self.on_message,
                on_close=self.on_close,
                on_error=self.on_error,
            )

            thread = threading.Thread(target=self.socket.run_forever)
            thread.start()
        except Exception as e:
            print(f"Failed to connect: {e}")
            self.is_connecting = False
            threading.Timer(self.reconnect_delay, self.connect).start()

    def on_open(self, ws):
        self.is_connecting = False
        self.last_heartbeat = time.time()

        if self.socket:
            self.socket.send(json.dumps({"action": "subscribe", "channel": self.team_id}))
            print("Connected")

        self.start_heartbeat_check()

    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            if data.get("type") == "heartbeat":
                self.handle_heartbeat(data)
            else:
                # Send acknowledgment if data contains an id
                if "id" in data:
                    try:
                        requests.post(
                            f"{REALTIME_API_URI}/api/v1/events/ack",
                            headers={"Content-Type": "application/json"},
                            json={"id": data["id"]},
                        )
                    except Exception as e:
                        print(f"Failed to send acknowledgment: {e}")
                
                if self.handle_event:
                    self.handle_event(data)
        except Exception as e:
            print(f"Failed to parse incoming message: {e}")

    def on_close(self, ws, close_status_code, close_msg):
        print("Disconnected. Attempting to reconnect...")
        self.is_connecting = False
        self.stop_heartbeat_check()
        threading.Timer(self.reconnect_delay, self.connect).start()

    def on_error(self, ws, error):
        print(f"WebSocket error: {error}")
        self.is_connecting = False
        ws.close()

    def handle_heartbeat(self, data):
        print("Heartbeat received", data)
        self.last_heartbeat = time.time()

    def start_heartbeat_check(self):
        def check_heartbeat():
            while self.socket:
                if time.time() - self.last_heartbeat > self.missed_heartbeats_limit:
                    print("No heartbeat received in 30 seconds! Closing connection.")
                    self.socket.close()
                    break
                time.sleep(self.heartbeat_interval)

        self.missed_heartbeat_check_timer = threading.Thread(target=check_heartbeat)
        self.missed_heartbeat_check_timer.start()

    def stop_heartbeat_check(self):
        if self.missed_heartbeat_check_timer:
            self.missed_heartbeat_check_timer = None

    def listen(self, callback):
        self.handle_event = callback
        self.connect()

    def disconnect(self):
        """Forcefully disconnect the WebSocket and clean up resources."""
        if self.socket:
            print("Disconnecting WebSocket...")
            self.socket.close()  # Close the socket
            self.stop_heartbeat_check()  # Stop any heartbeat check
            self.is_connecting = False  # Update connection state
            self.socket = None  # Clear the socket reference
            self.handle_event = None
