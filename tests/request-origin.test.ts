import { expect, it } from "vitest";
import { isTrustedMutation } from "../src/server/security/request-origin";
const env = {
  NODE_ENV: "production",
  VERCEL: "1",
  AUTH_URL: "http://localhost:3000",
  VERCEL_PROJECT_PRODUCTION_URL: "dentora-deutsch.vercel.app",
  VERCEL_URL: "dentora-build.vercel.app",
};
const request = (origin?: string) =>
  new Request("https://internal/api/trpc/learning.start", {
    method: "POST",
    headers: origin ? { origin } : {},
  });
it("accepts this production and preview deployment even with a stale AUTH_URL", () => {
  expect(
    isTrustedMutation(request("https://dentora-deutsch.vercel.app"), env),
  ).toBe(true);
  expect(
    isTrustedMutation(request("https://dentora-build.vercel.app"), env),
  ).toBe(true);
});
it("rejects other deployments, malformed, null and absent origins", () => {
  for (const origin of [
    undefined,
    "null",
    "https://attacker.vercel.app",
    "https://dentora-deutsch.vercel.app.evil.test",
    "https://dentora-deutsch.vercel.app/path",
  ])
    expect(isTrustedMutation(request(origin), env)).toBe(false);
});
it("does not trust forwarded headers or request host in production", () => {
  const req = new Request("https://evil.test/api/trpc", {
    method: "POST",
    headers: { origin: "https://evil.test", "x-forwarded-host": "evil.test" },
  });
  expect(isTrustedMutation(req, env)).toBe(false);
});
it("supports explicit custom domain and localhost development", () => {
  expect(
    isTrustedMutation(request("https://learn.example.com"), {
      NODE_ENV: "production",
      APP_URL: "https://learn.example.com",
    }),
  ).toBe(true);
  expect(
    isTrustedMutation(
      new Request("http://localhost:3000/api/trpc", {
        headers: { origin: "http://localhost:3000" },
      }),
      { NODE_ENV: "development" },
    ),
  ).toBe(true);
});
