import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
export const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        university: true,
        goalMinutes: true,
        publicProfile: true,
        emailReminders: true,
        role: true,
      },
    });
    const game = await ctx.db.gameState.upsert({
      where: { userId: ctx.userId },
      create: { userId: ctx.userId },
      update: {},
    });
    const activity = await ctx.db.dailyActivity.findMany({
      where: { userId: ctx.userId },
      orderBy: { day: "desc" },
      take: 90,
    });
    return { user, game, activity };
  }),
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(60),
        username: z.string().regex(/^[a-z0-9_]{3,24}$/),
        bio: z.string().max(300),
        university: z.string().max(100),
        goalMinutes: z.union([
          z.literal(15),
          z.literal(30),
          z.literal(60),
          z.literal(90),
        ]),
        publicProfile: z.boolean(),
        emailReminders: z.boolean(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.user.update({
        where: { id: ctx.userId },
        data: input,
        select: { id: true },
      }),
    ),
  public: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.user.findFirst({
        where: { username: input.username, publicProfile: true },
        select: {
          id: true,
          name: true,
          username: true,
          bio: true,
          university: true,
          game: { select: { xp: true, streak: true } },
          _count: {
            select: {
              follow_following: true,
              follow_follower: true,
              post_author: true,
            },
          },
        },
      }),
    ),
  badges: protectedProcedure.query(({ ctx }) =>
    ctx.db.badge.findMany({
      include: { awards: { where: { userId: ctx.userId } } },
      orderBy: { threshold: "asc" },
    }),
  ),
  certificates: protectedProcedure.query(({ ctx }) =>
    ctx.db.certificate.findMany({
      where: { userId: ctx.userId, revokedAt: null },
    }),
  ),
  notifications: protectedProcedure.query(({ ctx }) =>
    ctx.db.notification.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ),
  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.notification.updateMany({
        where: { id: input.id, userId: ctx.userId },
        data: { readAt: new Date() },
      }),
    ),
  sessions: protectedProcedure.query(({ ctx }) =>
    ctx.db.session.findMany({
      where: { userId: ctx.userId },
      select: { id: true, expires: true },
    }),
  ),
  revokeSession: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.session.deleteMany({
        where: { id: input.id, userId: ctx.userId },
      }),
    ),
});
