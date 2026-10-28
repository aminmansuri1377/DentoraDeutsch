import "../scripts/load-env";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedDatabase } from "./seed-data";
import { createSeedRunner } from "./seed-runner";
import { databaseConfig } from "../src/server/database/config";
import { databaseError } from "../src/server/database/diagnostics";
async function main() {
  const createClient = () => new PrismaClient({
    adapter: new PrismaPg({ ...databaseConfig(), max: 1, application_name: "dentora-seed" }),
  });
  const runner = createSeedRunner(createClient);
  try {
    await seedDatabase(runner.run);
  } finally {
    await runner.close();
  }
}
main().catch((error: unknown) => {
  console.error(`SEED_FAILED ${new Date().toISOString()}`);
  console.error(databaseError(error));
  console.error("Bereits gespeicherte Seed-Daten bleiben erhalten. Keine Tabellen zurücksetzen.");
  process.exitCode = 1;
});
