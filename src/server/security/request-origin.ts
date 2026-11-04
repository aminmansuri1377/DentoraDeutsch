type Environment = Record<string, string | undefined>;
function originOf(value: string | undefined): string | undefined {
  if (!value) return;
  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return;
    return url.origin;
  } catch {
    return;
  }
}
/** Exact allowlist only. Never trust client-supplied forwarding headers or *.vercel.app. */
export function isTrustedMutation(
  req: Request,
  env: Environment = process.env,
): boolean {
  const origin = req.headers.get("origin");
  if (!origin || originOf(origin) !== origin) return false;
  const allowed = new Set<string>();
  for (const value of [env.AUTH_URL, env.APP_URL]) {
    const parsed = originOf(value);
    if (parsed) allowed.add(parsed);
  }
  if (env.VERCEL === "1") {
    for (const host of [
      env.VERCEL_URL,
      env.VERCEL_PROJECT_PRODUCTION_URL,
      env.VERCEL_BRANCH_URL,
    ]) {
      if (host && /^[a-zA-Z0-9.-]+$/.test(host)) {
        const parsed = originOf(`https://${host}`);
        if (parsed) allowed.add(parsed);
      }
    }
  } else if (env.NODE_ENV !== "production") {
    const parsed = originOf(req.url);
    if (parsed) allowed.add(parsed);
  }
  return allowed.has(origin);
}
