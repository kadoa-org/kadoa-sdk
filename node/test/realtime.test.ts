import { test, expect, beforeEach, afterEach, vi } from "vitest";
import { Realtime } from "../src/realtime";

const MOCK_WSS_URI = "wss://mock-realtime.example.com";
const MOCK_PUBLIC_API_URI = "https://mock-api.example.com";

// Environment Variables Mock
process.env.WSS_API_URI = MOCK_WSS_URI;
process.env.PUBLIC_API_URI = MOCK_PUBLIC_API_URI;

// Mock variables
let mockFetch: any;
let mockWebSocket: any;
let instance: Realtime;

beforeEach(() => {
  // Mock WebSocket
  global.WebSocket = class {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = WebSocket.OPEN;
    send = vi.fn();
    close = vi.fn();

    onopen: ((this: WebSocket, ev: Event) => any) | null = null;
    onmessage: ((this: WebSocket, ev: MessageEvent<any>) => any) | null = null;
    onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
    onerror: ((this: WebSocket, ev: Event) => any) | null = null;

    constructor() {
      mockWebSocket = this;
    }
  } as any;

  // Mock Fetch API
  mockFetch = vi.fn(async () => ({
    json: async () => ({
      access_token: "mock_access_token",
      team_id: "mock_team_id",
    }),
  }));

  global.fetch = mockFetch;
});

afterEach(() => {
  vi.restoreAllMocks(); // Resets all mocks
  if (mockWebSocket) {
    mockWebSocket.send.mockReset();
    mockWebSocket.close.mockReset();
  }
});

// Constructor Tests
test("constructor throws error if no teamApiKey is provided", () => {
  expect(() => new Realtime()).toThrow("teamApiKey is required for Realtime connection");
});

test("constructor initializes with valid teamApiKey", () => {
  expect(() => new Realtime("mock-team-api-key")).not.toThrow();
});

// Listen Method Tests
test("listen initializes WebSocket connection and sends subscription", async () => {
  instance = new Realtime("mock-team-api-key");

  const mockCallback = vi.fn();
  instance.listen(mockCallback);

  await new Promise((resolve) => setTimeout(resolve, 0)); // Ensure async events are handled

  expect(mockWebSocket).toBeDefined();

  mockWebSocket.onopen?.(new Event("open"));

  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(mockWebSocket.send).toHaveBeenCalledWith(
    JSON.stringify({ action: "subscribe", channel: "mock_team_id" }),
  );

  const testPayload = { event: "update", data: { id: 1 } };

  const mockMessage = { data: JSON.stringify(testPayload) };
  mockWebSocket.onmessage?.(new MessageEvent("message", mockMessage));
  expect(mockCallback).toHaveBeenCalledWith(testPayload);
});

// Heartbeat Handling Tests
test("heartbeat message updates lastHeartbeat", async () => {
  instance = new Realtime("mock-team-api-key");
  instance.listen(() => {});

  await new Promise((resolve) => setTimeout(resolve, 0));

  mockWebSocket.onopen?.(new Event("open"));

  const initialHeartbeat = instance["lastHeartbeat"];
  const heartbeatMessage = { type: "heartbeat" };

  mockWebSocket.onmessage?.(new MessageEvent("message", { data: JSON.stringify(heartbeatMessage) }));

  expect(instance["lastHeartbeat"]).toBeGreaterThanOrEqual(initialHeartbeat);
});

// Reconnection Tests
test("attempts to reconnect after socket close", async () => {
  instance = new Realtime("mock-team-api-key");
  instance.listen(() => {});

  await new Promise((resolve) => setTimeout(resolve, 0));

  mockWebSocket.onopen?.(new Event("open"));

  // Mock the setTimeout behavior to spy on reconnection logic
  const setTimeoutSpy = vi.spyOn(global, "setTimeout");

  mockWebSocket.onclose?.(new CloseEvent("close"));

  expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);

  setTimeoutSpy.mockRestore();
});

// Error Handling Tests
test("logs error when WebSocket encounters an error", async () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  instance = new Realtime("mock-team-api-key");
  instance.listen(() => {});

  await new Promise((resolve) => setTimeout(resolve, 0));

  const errorEvent = new Event("error");
  mockWebSocket.onerror?.(errorEvent);

  expect(consoleErrorSpy).toHaveBeenCalledWith("WebSocket error:", errorEvent);

  consoleErrorSpy.mockRestore();
});

// Stop Heartbeat Check Tests
test("stops heartbeat check on socket close", async () => {
  instance = new Realtime("mock-team-api-key");
  instance.listen(() => {});

  await new Promise((resolve) => setTimeout(resolve, 0));

  mockWebSocket.onopen?.(new Event("open"));

  const clearIntervalSpy = vi.spyOn(global, "clearInterval");

  mockWebSocket.onclose?.(new CloseEvent("close"));

  expect(clearIntervalSpy).toHaveBeenCalled();

  clearIntervalSpy.mockRestore();
});



// Acknowledgement Tests

test("sends acknowledgment for messages with an id", async () => {
  instance = new Realtime("mock-team-api-key");
  const mockCallback = vi.fn();
  instance.listen(mockCallback);

  await new Promise((resolve) => setTimeout(resolve, 0)); // Ensure async events are handled

  mockWebSocket.onopen?.(new Event("open"));

  const testPayload = { id: "12345", event: "update", data: { key: "value" } };
  const mockMessage = { data: JSON.stringify(testPayload) };

  // Spy to log fetch requests
  const fetchSpy = vi.spyOn(global, "fetch");

  // Trigger onmessage event with payload containing an id
  mockWebSocket.onmessage?.(new MessageEvent("message", mockMessage));

  // console.log(JSON.stringify(fetchSpy.mock.calls));

  // Assert fetch is called with correct URL and options
  expect(mockFetch).toHaveBeenCalledTimes(2); // Initial fetch + ack fetch
  // expect(mockFetch).toHaveBeenCalledWith(
  //   `${process.env.WSS_API_URI}/api/v1/events/ack`,
  //   expect.objectContaining({
  //     method: "POST",
  //     headers: expect.objectContaining({ "Content-Type": "application/json" }),
  //     body: JSON.stringify({ id: "12345" }),
  //   }),
  // );

  // Ensure the callback is called with the event data
  // expect(mockCallback).toHaveBeenCalledWith(testPayload);

  fetchSpy.mockRestore();
});




test("don't send acknowledgment for messages without id", async () => {
  instance = new Realtime("mock-team-api-key");
  const mockCallback = vi.fn();
  instance.listen(mockCallback);

  await new Promise((resolve) => setTimeout(resolve, 0)); // Ensure async events are handled

  mockWebSocket.onopen?.(new Event("open"));

  const testPayload = {  event: "update", data: { key: "value" } };
  const mockMessage = { data: JSON.stringify(testPayload) };

  mockWebSocket.onmessage?.(new MessageEvent("message", mockMessage));

  expect(mockFetch).toHaveBeenCalledTimes(1); // Initial fetch only
});
