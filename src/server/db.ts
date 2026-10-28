import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { databaseConfig } from "./database/config";
const globalDb = globalThis as unknown as { dentoraDb?: Promise<PrismaClient> };
async function createDatabase() {
  if (
    process.env.LOCAL_DATABASE === "true" &&
    process.env.NODE_ENV === "development"
  ) {
    const { createLocalDatabase } = await import("./local-db");
    return createLocalDatabase();
  }
  return new PrismaClient({
    adapter: new PrismaPg(databaseConfig()),
  });
}
const ready = globalDb.dentoraDb ?? createDatabase();
if (process.env.NODE_ENV !== "production") globalDb.dentoraDb = ready;
export const db = await ready;
