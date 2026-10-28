import { describe, expect, it } from "vitest";
import { databaseConfig } from "../src/server/database/config";

const pem = "-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----";
describe("database TLS configuration", () => {
  it("supplies a verified CA without conflicting URL options", () => {
    const config = databaseConfig({ DATABASE_URL: "postgresql://user:password@localhost/db?sslmode=require&sslcert=old&application_name=dentora", DATABASE_SSL_CA: pem });
    expect(config.ssl).toEqual({ ca: pem, rejectUnauthorized: true });
    const url = new URL(config.connectionString!);
    expect(url.searchParams.has("sslmode")).toBe(false);
    expect(url.searchParams.has("sslcert")).toBe(false);
    expect(url.searchParams.get("application_name")).toBe("dentora");
  });
  it("preserves URL TLS settings without a custom CA", () => {
    expect(databaseConfig({ DATABASE_URL: "postgresql://localhost/db?sslmode=verify-full" }).connectionString).toContain("sslmode=verify-full");
  });
  it("fails closed for a missing certificate file", () => {
    expect(() => databaseConfig({ DATABASE_URL: "postgresql://localhost/db", DATABASE_SSL_CA_FILE: "nonexistent-ca-file.crt" })).toThrow("CA-Zertifikat");
  });
  it("rejects missing URLs and invalid PEM", () => {
    expect(() => databaseConfig({})).toThrow("DATABASE_URL");
    expect(() => databaseConfig({ DATABASE_URL: "postgresql://localhost/db", DATABASE_SSL_CA: "invalid" })).toThrow("PEM");
  });
});
