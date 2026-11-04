import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
export const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      select: {
        id: true,
        name: true,
        image: true,
        username: true,
        bio: true,
        university: true,
        goalMinutes: true,
        publicProfile: true,
        emailReminders: true,
        role: true,
        _count: {
          select: {
            follow_following: true,
            follow_follower: true,
            post_author: { where: { deletedAt: null } },
          },
        },
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
    .input(z.object({ username: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const viewerId = ctx.session?.user?.id;
      const user = await ctx.db.user.findFirst({
        where: {
          ...(input.username.startsWith("~")
            ? { id: input.username.slice(1) }
            : { username: input.username }),
          OR: [
            { publicProfile: true },
            ...(viewerId ? [{ id: viewerId }] : []),
          ],
        },
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
          bio: true,
          university: true,
          game: { select: { xp: true, streak: true } },
          userBadge_user: { include: { badge: true } },
          _count: {
            select: {
              follow_following: true,
              follow_follower: true,
              post_author: { where: { deletedAt: null } },
            },
          },
        },
      });
      if (!user) return null;
      const following = viewerId
        ? await ctx.db.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewerId,
                followingId: user.id,
              },
            },
            select: { id: true },
          })
        : null;
      return { ...user, isSelf: viewerId === user.id, following: !!following };
    }),
  connections: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        kind: z.enum(["followers", "following"]),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const visible = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
          OR: [{ publicProfile: true }, { id: ctx.userId }],
        },
        select: { id: true },
      });
      if (!visible) return { items: [], nextCursor: undefined };
      const person = {
        id: true,
        name: true,
        username: true,
        image: true,
      } as const;
      const rows = await ctx.db.follow.findMany({
        where:
          input.kind === "followers"
            ? { followingId: input.userId }
            : { followerId: input.userId },
        select: {
          id: true,
          follower: { select: person },
          following: { select: person },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 21,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      return {
        items: rows
          .slice(0, 20)
          .map((row) =>
            input.kind === "followers" ? row.follower : row.following,
          ),
        nextCursor: rows.length > 20 ? rows[19].id : undefined,
      };
    }),
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
