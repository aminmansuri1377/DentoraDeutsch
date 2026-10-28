import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), true);
const args = process.argv.slice(2);
const port = args.includes("--port")
  ? args[args.indexOf("--port") + 1]
  : (process.env.PORT ?? "3000");
const local =
  args.includes("--local") ||
  (!process.env.DATABASE_URL && args.includes("--auto-local"));
const env = {
  ...process.env,
  ...(local ? { LOCAL_DATABASE: "true", ENABLE_DEMO_AUTH: "true" } : {}),
  AUTH_SECRET: process.env.AUTH_SECRET || randomBytes(32).toString("hex"),
};
if (local)
  console.log(
    "Local test database enabled. Panel: /panel · Password: 1111. Never use this mode for real accounts.",
  );
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--webpack",
    "--hostname",
    "0.0.0.0",
    "--port",
    port,
  ],
  { stdio: "inherit", env },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
