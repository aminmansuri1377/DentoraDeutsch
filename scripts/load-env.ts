import nextEnv from "@next/env";
// Match Next.js, including .env.local precedence.
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
