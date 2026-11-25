import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { seedDatabase } from "../../prisma/seed-data";

/** Single-process local development only. Supabase/pg remains the production path. */
export async function createLocalDatabase() {
  if (process.env.NODE_ENV !== "development")
    throw new Error("LOCAL_DATABASE is only supported by next dev.");
  const folder = join(process.cwd(), ".local-database");
  const engine = new PGlite(folder);
  const found = await engine.query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='User' AND table_schema='public') AS exists`,
  );
  if (!found.rows[0].exists)
    await engine.exec(
      await readFile(
        join(process.cwd(), "prisma/migrations/202610280001_initial/migration.sql"),
        "utf8",
      ),
    );
  await engine.exec(
    await readFile(
      join(process.cwd(), "prisma/migrations/202611040001_letter_questions/migration.sql"),
      "utf8",
    ),
  );
  const client = new PrismaClient({ adapter: new PrismaPGlite(engine) });
  // The local database is persistent; repeated seed upserts block every cold start.
  const marker = join(folder, "dentora-seed-v1.done");
  const alreadySeeded = await readFile(marker, "utf8").then(
    () => true,
    () => false,
  );
  if (!alreadySeeded) {
    await seedDatabase(client);
    await writeFile(marker, "seed completed\n", "utf8");
  }
  return client;
}
