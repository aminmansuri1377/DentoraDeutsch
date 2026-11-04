import "../scripts/load-env";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { databaseConfig } from "../src/server/database/config";
import { createSeedRunner } from "./seed-runner";
import { importFirstLesson } from "./import-first-lesson";
const runner = createSeedRunner(
  () =>
    new PrismaClient({
      adapter: new PrismaPg({ ...databaseConfig(), max: 1 }),
    }),
);
try {
  await importFirstLesson(runner.run);
  console.log("IMPORT_OK: Endodontologie – 2 Lernseiten, 5 Fragen.");
} catch {
  console.error(
    "IMPORT_FAILED: Prüfe Migrationen und Datenbankverbindung. Bereits importierte Inhalte bleiben erhalten; der Import kann wiederholt werden.",
  );
  process.exitCode = 1;
} finally {
  await runner.close();
}
