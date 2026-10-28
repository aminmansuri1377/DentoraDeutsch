import { it, expect, vi, afterEach } from "vitest";
import { testModeEnabled } from "@/server/test-mode";
afterEach(() => vi.unstubAllEnvs());
it("keeps test access off in production unless explicitly enabled", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("ENABLE_DEMO_AUTH", "");
  expect(testModeEnabled()).toBe(false);
  vi.stubEnv("ENABLE_DEMO_AUTH", "true");
  expect(testModeEnabled()).toBe(true);
});
it("allows local testing and supports explicit opt-out", () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("ENABLE_DEMO_AUTH", "");
  expect(testModeEnabled()).toBe(true);
  vi.stubEnv("ENABLE_DEMO_AUTH", "false");
  expect(testModeEnabled()).toBe(false);
});
