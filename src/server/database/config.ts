import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PoolConfig } from "pg";

/** One TLS policy for the application, seed and connection check. */
export function databaseConfig(env: Record<string, string | undefined> = process.env): PoolConfig {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL fehlt in .env.");
  const url = new URL(env.DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL muss eine PostgreSQL-Adresse sein.");
  }
  const certificatePath = env.DATABASE_SSL_CA_FILE || url.searchParams.get("sslrootcert");
  let ca = env.DATABASE_SSL_CA?.replace(/\\n/g, "\n");
  if (!ca && certificatePath) {
    try {
      ca = readFileSync(resolve(certificatePath), "utf8");
    } catch {
      throw new Error("Das CA-Zertifikat konnte nicht gelesen werden. Prüfe DATABASE_SSL_CA_FILE.");
    }
  }
  if (ca && !ca.includes("-----BEGIN CERTIFICATE-----")) {
    throw new Error("Das CA-Zertifikat muss im PEM-Format vorliegen.");
  }
  if (ca) {
    // pg connection-string SSL options override an explicit ssl object.
    // Remove them only when supplying our explicit, verified CA configuration.
    for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey", "sslpassword", "ssl", "uselibpqcompat"]) {
      url.searchParams.delete(key);
    }
  }
  return {
    connectionString: url.toString(),
    ...(ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    application_name: "dentora",
  };
}
