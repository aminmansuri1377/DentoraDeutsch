import { createHash } from "node:crypto";
import { db } from "./db";
export async function limit(key: string, maximum = 30, windowSeconds = 60) {
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const id = createHash("sha256").update(`${key}:${window}`).digest("hex");
  const value = await db.rateLimit.upsert({
    where: { id },
    create: { id, expiresAt: new Date((window + 1) * windowSeconds * 1000) },
    update: { count: { increment: 1 } },
  });
  return value.count <= maximum;
}
