import { afterEach, it, vi, expect } from "vitest";
import { rpcFetch } from "../src/trpc/rpc-fetch";
afterEach(() => vi.unstubAllGlobals());
it("turns a plain 403 into a readable German error", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("Forbidden", { status: 403 })),
  );
  await expect(rpcFetch("/api/trpc")).rejects.toThrow(
    "Die Anfrage wurde blockiert",
  );
});
it("preserves structured tRPC errors and disables caching", async () => {
  const response = Response.json(
    { error: { message: "Kurszugang erforderlich" } },
    { status: 403 },
  );
  const fetcher = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetcher);
  expect(await rpcFetch("/api/trpc", { method: "POST" })).toBe(response);
  expect(fetcher).toHaveBeenCalledWith("/api/trpc", {
    method: "POST",
    cache: "no-store",
  });
});
