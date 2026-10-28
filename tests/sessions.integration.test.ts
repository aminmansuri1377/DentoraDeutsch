import { beforeAll, afterAll, beforeEach, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";
const state = vi.hoisted(() => ({
  db: null as unknown as PrismaClient,
  cookies: new Map<string, string>(),
  verifiedId: null as string | null,
}));
vi.mock("@/server/db", () => ({
  get db() {
    return state.db;
  },
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      state.cookies.has(name) ? { value: state.cookies.get(name) } : undefined,
    set: (name: string, value: string) => state.cookies.set(name, value),
    delete: (name: string) => state.cookies.delete(name),
  }),
}));
vi.mock("@/server/auth", () => ({
  verifiedAuth: async () =>
    state.verifiedId ? { user: { id: state.verifiedId } } : null,
}));
import {
  createTestSession,
  testSession,
  clearTestSession,
} from "@/server/demo-session";
import {
  issuePanelSession,
  panelIdentity,
  clearPanelSession,
} from "@/server/panel/session";
import { seal, matchesSecret } from "@/server/panel/crypto";
let pg: PGlite;
beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(
    readFileSync(
      "prisma/migrations/202610280001_initial/migration.sql",
      "utf8",
    ),
  );
  state.db = new PrismaClient({ adapter: new PrismaPGlite(pg) });
  process.env.AUTH_SECRET =
    "isolated-tests-use-a-long-secret-for-encryption-only";
});
beforeEach(() => {
  state.cookies.clear();
  state.verifiedId = null;
  process.env.ENABLE_DEMO_AUTH = "true";
});
afterAll(async () => {
  delete process.env.ENABLE_DEMO_AUTH;
  await state.db.$disconnect();
  await pg.close();
});
it("registers and signs in any valid test email without a verification token", async () => {
  const user = await createTestSession("learner@example.com");
  expect((await testSession())?.user.id).toBe(user.id);
  expect(await state.db.verificationToken.count()).toBe(0);
  expect(
    (await state.db.user.findUniqueOrThrow({ where: { id: user.id } }))
      .emailVerified,
  ).toBeNull();
  const again = await createTestSession("learner@example.com");
  expect(again.id).toBe(user.id);
});
it("invalidates test sessions on logout or disabling the mode", async () => {
  await createTestSession("logout@example.com");
  await clearTestSession();
  expect(await testSession()).toBeNull();
  await createTestSession("disabled@example.com");
  process.env.ENABLE_DEMO_AUTH = "false";
  expect(await testSession()).toBeNull();
  await expect(createTestSession("new@example.com")).rejects.toThrow();
});
it("keeps learner login separate from the panel password session", async () => {
  await createTestSession("no-admin@example.com");
  expect(await panelIdentity()).toBeNull();
  expect(matchesSecret("1111", "1111")).toBe(true);
  expect(matchesSecret("1112", "1111")).toBe(false);
  await issuePanelSession();
  expect((await panelIdentity())?.mode).toBe("test");
  await clearPanelSession();
  expect(await panelIdentity()).toBeNull();
});
it("rejects expired or wrong-purpose panel cookies", async () => {
  state.cookies.set(
    "dentora.panel",
    seal({ purpose: "panel-login", expires: Date.now() - 1 }),
  );
  expect(await panelIdentity()).toBeNull();
  state.cookies.set(
    "dentora.panel",
    seal({ purpose: "panel-record", expires: Date.now() + 10000 }),
  );
  expect(await panelIdentity()).toBeNull();
});
it("uses only verified ADMIN accounts when test mode is disabled", async () => {
  const user = await state.db.user.create({
    data: { email: "verified@example.com" },
  });
  state.verifiedId = user.id;
  process.env.ENABLE_DEMO_AUTH = "false";
  expect(await panelIdentity()).toBeNull();
  await state.db.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });
  expect(await panelIdentity()).toMatchObject({
    actorId: user.id,
    mode: "verified",
  });
});
