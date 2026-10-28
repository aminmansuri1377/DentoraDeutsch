import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { panelIdentity } from "./panel/session";
import { testModeEnabled } from "./test-mode";
import { auth } from "./auth";
import { db } from "./db";
import { limit } from "./rate-limit";
export async function createContext() {
  return { db, session: await auth() };
}
const t = initTRPC.context<Awaited<ReturnType<typeof createContext>>>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      message:
        error.code === "INTERNAL_SERVER_ERROR"
          ? "Ein interner Fehler ist aufgetreten. Bitte versuche es später erneut."
          : shape.message,
      data: { ...shape.data, stack: undefined },
    };
  },
});
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(
  async ({ ctx, next, type }) => {
    const userId = ctx.session?.user?.id;
    if (!userId)
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Bitte melde dich an.",
      });
    if (type === "mutation" && !(await limit(`mutation:${userId}`, 60)))
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Bitte warte einen Moment.",
      });
    return next({ ctx: { ...ctx, userId } });
  },
);
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (testModeEnabled() && !(await panelIdentity()))
    throw new TRPCError({ code: "FORBIDDEN" });
  const user = await db.user.findUnique({ where: { id: ctx.userId } });
  if (user?.role !== "ADMIN" && user?.role !== "EDITOR")
    throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, role: user.role } });
});

export const panelProcedure = t.procedure.use(async ({ ctx, next, type }) => {
  const identity = await panelIdentity();
  if (!identity)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Bitte melde dich im Adminbereich an.",
    });
  if (
    type === "mutation" &&
    !(await limit("panel:" + (identity.actorId ?? "test"), 100))
  )
    throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  return next({ ctx: { ...ctx, panel: identity } });
});
