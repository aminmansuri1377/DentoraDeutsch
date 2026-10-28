import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";
const state = vi.hoisted(() => ({
  db: null as unknown as PrismaClient,
  authorized: false,
}));
vi.mock("@/server/db", () => ({
  get db() {
    return state.db;
  },
}));
vi.mock("@/server/auth", () => ({
  auth: async () => null,
  verifiedAuth: async () => null,
}));
vi.mock("@/server/panel/session", () => ({
  panelIdentity: async () =>
    state.authorized ? { actorId: null, mode: "test" } : null,
}));
import { allMetadata, validateFields } from "@/server/panel/registry";
import { listRecords, saveRecord, deleteRecord } from "@/server/panel/service";
import { seal, unseal } from "@/server/panel/crypto";
import { appRouter } from "@/server/routers";
let engine: PGlite;
beforeAll(async () => {
  process.env.AUTH_SECRET =
    "unit-test-secret-with-more-than-thirty-two-characters";
  engine = new PGlite();
  await engine.exec(
    readFileSync(
      "prisma/migrations/202610280001_initial/migration.sql",
      "utf8",
    ),
  );
  state.db = new PrismaClient({ adapter: new PrismaPGlite(engine) });
});
afterAll(async () => {
  await state.db.$disconnect();
  await engine.close();
});
it("includes every Prisma model with a usable record key", () => {
  expect(allMetadata()).toHaveLength(49);
  for (const m of allMetadata()) {
    expect(m.keys.length).toBeGreaterThan(0);
    expect(m.fields.length).toBeGreaterThan(0);
  }
});
it("denies access to all panel operations without a panel session", async () => {
  const caller = appRouter.createCaller({ db: state.db, session: null });
  await expect(caller.panel.metadata()).rejects.toMatchObject({
    code: "UNAUTHORIZED",
  });
  await expect(
    caller.panel.save({ model: "User", data: { email: "x@example.com" } }),
  ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  await expect(
    caller.panel.remove({ model: "User", key: "x", confirmation: "LÖSCHEN" }),
  ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
});
it("rejects unknown fields, nested writes, invalid types and primary-key edits", () => {
  expect(() =>
    validateFields("User", { sessions: { create: {} } }, true),
  ).toThrow();
  expect(() => validateFields("User", { role: "SUPERADMIN" }, true)).toThrow();
  expect(() => validateFields("User", { goalMinutes: "15" }, true)).toThrow();
  expect(() => validateFields("User", { id: "changed" }, true)).toThrow();
  expect(() => validateFields("Unknown", {}, false)).toThrow();
});
it("encrypts keys and detects tampering", () => {
  const token = seal({ token: "private-token" });
  expect(token).not.toContain("private-token");
  expect(unseal(token)).toEqual({ token: "private-token" });
  expect(unseal(token.slice(0, -5) + "wrong")).toBeNull();
});
it("supports create/read/update for all 49 tables and deletes in reverse dependency order", async () => {
  const ids: Record<string, string> = {};
  const rows: { model: string; key: string }[] = [];
  for (const m of allMetadata()) {
    const data: Record<string, unknown> = {};
    for (const f of m.fields) {
      if (f.readonly || !f.required || f.hasDefault) continue;
      if (f.relation) {
        data[f.name] = ids[f.relation];
        if (f.name === "followingId")
          data[f.name] = (
            await state.db.user.create({
              data: { email: "second@example.com" },
            })
          ).id;
        continue;
      }
      if (f.options) {
        data[f.name] = f.options[0];
        continue;
      }
      data[f.name] =
        f.type === "DateTime"
          ? new Date(Date.now() + 86400000).toISOString()
          : f.type === "Boolean"
            ? false
            : f.type === "Int"
              ? 1
              : `test-${m.name}-${f.name}`;
    }
    if (m.name === "User") data.email = "panel-test@example.com";
    const created = await saveRecord(m.name, undefined, data, null);
    expect(created?.key, m.name).toBeTruthy();
    const row = created!;
    if (typeof row.values.id === "string") ids[m.name] = row.values.id;
    rows.push({ model: m.name, key: row.key });
    const listed = await listRecords(m.name, 0, "");
    expect(listed.total, m.name).toBeGreaterThan(0);
    const field = m.fields.find(
      (f) =>
        !f.primary &&
        !f.readonly &&
        !f.secret &&
        !f.relation &&
        ["String", "Int", "Boolean", "DateTime"].includes(f.type) &&
        !["key", "email", "username", "position"].includes(f.name),
    );
    if (field) {
      const value =
        field.type === "DateTime"
          ? new Date(Date.now() + 172800000).toISOString()
          : field.type === "Boolean"
            ? true
            : field.type === "Int"
              ? 2
              : "Geänderter Testwert";
      const updated = await saveRecord(
        m.name,
        row.key,
        { [field.name]: value },
        null,
      );
      expect(updated?.values[field.name], m.name).toBeDefined();
    }
  }
  const sessionRows = await listRecords("Session", 0, "");
  expect(sessionRows.rows[0].values.sessionToken).toBeNull();
  const tokenRows = await listRecords("VerificationToken", 0, "");
  expect(tokenRows.rows[0].values.token).toBeNull();
  for (const row of rows.reverse())
    expect(
      (await deleteRecord(row.model, row.key, null))?.deleted,
      row.model,
    ).toBe(true);
}, 60000);
