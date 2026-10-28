import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { seedDatabase } from "../../prisma/seed-data";
/** Single-process local development only. Supabase/pg remains the production path. */
export async function createLocalDatabase() {
  if (process.env.NODE_ENV !== "development")
    throw new Error("LOCAL_DATABASE is only supported by next dev.");
  const engine = new PGlite(join(process.cwd(), ".local-database"));
  const found = await engine.query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='User' AND table_schema='public') AS exists`,
  );
  if (!found.rows[0].exists)
    await engine.exec(
      await readFile(
        join(
          process.cwd(),
          "prisma/migrations/202610280001_initial/migration.sql",
        ),
        "utf8",
      ),
    );
  const client = new PrismaClient({ adapter: new PrismaPGlite(engine) });
  await seedDatabase(client);
  return client;
}
