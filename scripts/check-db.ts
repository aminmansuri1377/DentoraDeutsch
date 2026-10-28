import "./load-env";
import pg from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { databaseConfig } from "../src/server/database/config";
import { databaseError } from "../src/server/database/diagnostics";
let stage = "CONFIG";
async function main() {
  const config = { ...databaseConfig(), max: 1, application_name: "dentora-check" };
  const url = new URL(config.connectionString!);
  console.log(`CHECK_TARGET: ${url.hostname}:${url.port || "5432"}`);
  const client = new pg.Client({ ...config, query_timeout: 15000 });
  let backgroundError: Error | undefined;
  client.on("error", (error) => { backgroundError = error; });
  try {
    stage = "PG_CONNECT";
    await client.connect();
    for (let i = 1; i <= 10; i++) {
      stage = `PG_TRANSACTION_${i}`;
      if (backgroundError) throw backgroundError;
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT 1");
      await client.query("COMMIT");
    }
    console.log("PG_OK: 10 Transaktionen erfolgreich.");
  } finally { await client.end().catch(() => {}); }
  const db = new PrismaClient({ adapter: new PrismaPg(config) });
  try {
    for (let i = 1; i <= 10; i++) {
      stage = `PRISMA_TRANSACTION_${i}`;
      await db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
        await tx.course.findFirst({ select: { id: true } });
        await tx.question.findFirst({ select: { id: true } });
      }, { timeout: 15000, maxWait: 15000 });
    }
    console.log("DATABASE_OK: 10 pg- und 10 Prisma-Transaktionen erfolgreich. Kein dauerhafter Stabilitätsnachweis.");
  } finally { await db.$disconnect(); }
}
main().catch((error: unknown) => {
  console.error(`DATABASE_FAILED stage=${stage} time=${new Date().toISOString()}`);
  console.error(databaseError(error));
  process.exitCode = 1;
});
