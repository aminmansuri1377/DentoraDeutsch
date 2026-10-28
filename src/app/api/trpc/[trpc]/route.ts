import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers";
import { createContext } from "@/server/trpc";
function handler(req: Request) {
  if (req.method === "POST") {
    const origin = req.headers.get("origin");
    const expected = new URL(process.env.AUTH_URL ?? req.url).origin;
    if (!origin || origin !== expected)
      return new Response("Forbidden", { status: 403 });
  }
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
}
export { handler as GET, handler as POST };
