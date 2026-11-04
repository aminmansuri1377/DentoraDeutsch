import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { uploadObject } from "../src/server/media/storage";
const fetchMock = vi.fn();
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-not-for-logs");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it("recovers from a lost response with the exact same key and bytes", async () => {
  fetchMock
    .mockRejectedValueOnce(new TypeError("fetch failed"))
    .mockResolvedValueOnce(new Response("{}", { status: 200 }));
  const bytes = Buffer.from("image");
  const result = uploadObject("user/random.webp", bytes);
  await vi.runAllTimersAsync();
  await result;
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const [first, second] = fetchMock.mock.calls;
  expect(first[0]).toBe(second[0]);
  expect(first[1].body).toEqual(second[1].body);
  expect(second[1].headers["x-upsert"]).toBe("true");
});
it("retries temporary HTTP failures but stops after three attempts", async () => {
  fetchMock.mockImplementation(async () => new Response("", { status: 503 }));
  const result = expect(
    uploadObject("user/random.webp", Buffer.from("x")),
  ).rejects.toThrow("ausgelastet");
  await vi.runAllTimersAsync();
  await result;
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
it("does not retry invalid credentials or bucket permissions", async () => {
  fetchMock.mockResolvedValueOnce(new Response("", { status: 403 }));
  await expect(
    uploadObject("user/random.webp", Buffer.from("x")),
  ).rejects.toThrow("abgelehnt");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("reports exhausted network failures without exposing credentials", async () => {
  fetchMock.mockRejectedValue(
    new TypeError("secret-not-for-logs", {
      cause: { code: "ECONNRESET" },
    }),
  );
  const result = expect(
    uploadObject("user/random.webp", Buffer.from("x")),
  ).rejects.toThrow("momentan nicht erreichbar");
  await vi.runAllTimersAsync();
  await result;
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(
    "secret-not-for-logs",
  );
});
it("does not retry certificate errors or weaken TLS", async () => {
  fetchMock.mockRejectedValue(
    new TypeError("fetch failed", {
      cause: { code: "SELF_SIGNED_CERT_IN_CHAIN" },
    }),
  );
  await expect(
    uploadObject("user/random.webp", Buffer.from("x")),
  ).rejects.toThrow("sichere Verbindung");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
