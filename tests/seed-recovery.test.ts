import { it, expect, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createSeedRunner } from "../prisma/seed-runner";
import { databaseError } from "../src/server/database/diagnostics";

function setup() {
  const clients: { $disconnect: ReturnType<typeof vi.fn> }[] = [];
  const create = vi.fn(() => {
    const client = { $disconnect: vi.fn(async () => {}) };
    clients.push(client);
    return client as unknown as PrismaClient;
  });
  return { clients, create, runner: createSeedRunner(create, { wait: async () => {}, log: () => {} }) };
}
it("reconnects and retries only the failed idempotent operation", async () => {
  const { clients, create, runner } = setup();
  const first = vi.fn(async () => "completed");
  await runner.run(first);
  const retry = vi.fn().mockRejectedValueOnce({ code: "P1017" }).mockResolvedValueOnce("recovered");
  expect(await runner.run(retry)).toBe("recovered");
  expect(first).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledTimes(2);
  expect(clients[0].$disconnect).toHaveBeenCalledTimes(1);
  expect(retry.mock.calls[0][0]).not.toBe(retry.mock.calls[1][0]);
  await runner.close();
  expect(clients[1].$disconnect).toHaveBeenCalledTimes(1);
});
it("stops after four attempts and does not retry TLS or validation errors", async () => {
  const { runner } = setup();
  const fail = vi.fn(async () => { throw { code: "P1017" }; });
  await expect(runner.run(fail)).rejects.toMatchObject({ code: "P1017" });
  expect(fail).toHaveBeenCalledTimes(4);
  await runner.close();
  for (const code of ["P1011", "P1000", "P2002"]) {
    const { runner: other } = setup();
    const operation = vi.fn(async () => { throw { code }; });
    await expect(other.run(operation)).rejects.toMatchObject({ code });
    expect(operation).toHaveBeenCalledTimes(1);
    await other.close();
  }
});
it("reports missing CA distinctly without exposing arbitrary error messages", () => {
  expect(databaseError(new Error("Das CA-Zertifikat konnte nicht gelesen werden."))).toContain("CA-Zertifikat");
  expect(databaseError({ message: "postgres://secret:password@host/db" })).not.toContain("password");
});
