import type { PrismaClient } from "@prisma/client";
import { setTimeout as delay } from "node:timers/promises";
export type SeedOperation = <T>(operation: (db: PrismaClient) => Promise<T>) => Promise<T>;
/** ONLY for seed unique-key upserts with update: {}. Not for arbitrary application writes. */
export function createSeedRunner(createClient: () => PrismaClient, options: { wait?: (ms: number) => Promise<unknown>; log?: (line: string) => void } = {}) {
  let client: PrismaClient | undefined;
  let totalRetries = 0, completed = 0;
  const log = options.log ?? console.log;
  const close = async () => {
    const previous = client;
    client = undefined;
    await previous?.$disconnect().catch(() => {});
  };
  const run: SeedOperation = async (operation) => {
    for (let attempt = 0; ; attempt++) {
      client ??= createClient();
      try {
        const result = await operation(client);
        completed++;
        if (completed % 10 === 0) log(`SEED_PROGRESS: ${completed} Schritte abgeschlossen.`);
        return result;
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (!["P1017", "P1001", "ECONNRESET", "EPIPE", "57P01", "57P02", "57P03"].includes(code ?? "") || attempt >= 3 || totalRetries >= 12) throw error;
        totalRetries++;
        log(`SEED_RECONNECT: ${code}; Schritt ${completed + 1}, Wiederholung ${attempt + 1}/3.`);
        await close();
        await (options.wait ?? delay)(1000 * 2 ** attempt);
      }
    }
  };
  return { run, close };
}
