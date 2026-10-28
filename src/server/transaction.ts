import { Prisma } from "@prisma/client";
import { db } from "./db";
import { TRPCError } from "@trpc/server";
const TRANSACTION_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 10_000,
  timeout: 30_000,
};
export async function atomic<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let i = 0; i < 4; i++) {
    try {
      return await db.$transaction(work, TRANSACTION_OPTIONS);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P1017", "P1001", "P1002", "P2028"].includes(error.code)
      ) {
        throw new TRPCError({
          code: "TIMEOUT",
          message:
            "Die Datenbank antwortet gerade nicht zuverlässig. Bitte versuche dieselbe Aktion erneut; deine gespeicherten Antworten bleiben erhalten.",
          cause: error,
        });
      }
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2034" ||
        i === 3
      )
        throw error;
    }
  }
  throw new Error("Transaktion fehlgeschlagen.");
}
