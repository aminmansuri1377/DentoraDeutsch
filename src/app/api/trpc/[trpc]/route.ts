import { isTrustedMutation } from "@/server/security/request-origin";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers";
import { createContext } from "@/server/trpc";
function handler(req: Request) {
  if (req.method === "POST" && !isTrustedMutation(req)) {
    console.warn(
      "[tRPC] Mutation rejected: untrusted or missing Origin. Check APP_URL/AUTH_URL.",
    );
    return new Response("Forbidden", {
      status: 403,
      headers: { "cache-control": "private, no-store" },
    });
  }
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    responseMeta: () => ({ headers: { "cache-control": "private, no-store" } }),
    onError({ path, error }) {
      // Record actionable metadata without logging inputs, credentials or SQL.
      const cause = error.cause as { code?: string } | undefined;
      console.error("[tRPC]", {
        path,
        code: error.code,
        databaseCode: cause?.code,
        time: new Date().toISOString(),
      });
    },
  });
}
export { handler as GET, handler as POST };
