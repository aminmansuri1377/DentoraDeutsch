import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../prisma/seed-data";
import { createSeedRunner } from "../prisma/seed-runner";

it("recovers a lost acknowledgement after commit without duplicate seed rows", async () => {
  const engine = new PGlite();
  await engine.exec(readFileSync("prisma/migrations/202610280001_initial/migration.sql", "utf8"));
  const db = new PrismaClient({ adapter: new PrismaPGlite(engine) });
  // Keep the shared test database open while simulating replacement transport clients.
  const runner = createSeedRunner(() => new Proxy(db, {
    get(target, key) {
      if (key === "$disconnect") return async () => {};
      const value = Reflect.get(target, key);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }), { wait: async () => {}, log: () => {} });
  let writes = 0, injected = false;
  try {
    await seedDatabase((operation) => runner.run(async (client) => {
      const result = await operation(client);
      if (++writes === 60 && !injected) {
        injected = true;
        throw { code: "P1017" };
      }
      return result;
    }));
    const counts = async () => Promise.all([db.specialty.count(), db.course.count(), db.chapter.count(), db.lesson.count(), db.question.count(), db.answerOption.count()]);
    const before = await counts();
    await seedDatabase(db);
    expect(await counts()).toEqual(before);
    expect(injected).toBe(true);
    expect(await db.lesson.count({ where: { status: "PUBLISHED" } })).toBe(4);
  } finally {
    await runner.close();
    await db.$disconnect();
    await engine.close();
  }
});
