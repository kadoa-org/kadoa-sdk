import { test, expect, mock } from "bun:test";
const random = mock(() => Math.random());

// import { Kadoa } from "../src";

const MOCK_WSS_URI = "wss://mock-realtime.kadoa.com";
const MOCK_PUBLIC_API_URI = "https://mock-api.kadoa.com";

process.env.WSS_KADOA_API_URI = MOCK_WSS_URI;
process.env.PUBLIC_KADOA_API_URI = MOCK_PUBLIC_API_URI;

test("random", () => {
  const val = random();
  expect(val).toBeGreaterThan(0);
  expect(random).toHaveBeenCalled();
  expect(random).toHaveBeenCalledTimes(1);
});