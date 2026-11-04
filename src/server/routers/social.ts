import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
const postInput = z
  .object({ body: z.string().trim().max(5000), mediaId: z.string().optional() })
  .refine((x) => x.body.length > 0 || !!x.mediaId, {
    message: "Bitte schreibe etwas oder füge ein Bild hinzu.",
  });
export const socialRouter = router({
  feed: protectedProcedure
    .input(
      z.object({
        filter: z.enum(["all", "mine", "saved"]).default("all"),
        search: z.string().max(100).default(""),
        authorId: z.string().optional(),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (
        input.authorId &&
        input.authorId !== ctx.userId &&
        !(await ctx.db.user.findFirst({
          where: { id: input.authorId, publicProfile: true },
          select: { id: true },
        }))
      )
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profil nicht verfügbar.",
        });
      const rows = await ctx.db.post.findMany({
        where: {
          deletedAt: null,
          body: { contains: input.search, mode: "insensitive" },
          ...(input.authorId ? { authorId: input.authorId } : {}),
          ...(input.filter === "mine" ? { authorId: ctx.userId } : {}),
          ...(input.filter === "saved"
            ? { bookmarks: { some: { userId: ctx.userId } } }
            : {}),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              university: true,
              follow_following: {
                where: { followerId: ctx.userId },
                select: { id: true },
              },
            },
          },
          media_post: { where: { status: "READY" }, select: { id: true } },
          _count: {
            select: { likes: true, comments: { where: { deletedAt: null } } },
          },
          likes: { where: { userId: ctx.userId }, select: { id: true } },
          bookmarks: { where: { userId: ctx.userId }, select: { id: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 21,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      return {
        items: rows.slice(0, 20),
        nextCursor: rows.length > 20 ? rows[19].id : undefined,
        viewerId: ctx.userId,
      };
    }),
  create: protectedProcedure.input(postInput).mutation(async ({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: { body: input.body, authorId: ctx.userId },
      });
      if (input.mediaId) {
        const attached = await tx.media.updateMany({
          where: {
            id: input.mediaId,
            ownerId: ctx.userId,
            status: "READY",
            postId: null,
          },
          data: { postId: post.id },
        });
        if (attached.count !== 1)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Dieses Bild ist nicht verfügbar. Bitte lade es erneut hoch.",
          });
      }
      return post;
    }),
  ),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.post.updateMany({
        where: { id: input.id, authorId: ctx.userId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (!result.count)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Beitrag nicht gefunden.",
        });
      return { removed: true };
    }),
  like: protectedProcedure
    .input(z.object({ postId: z.string(), liked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (
        !(await ctx.db.post.findFirst({
          where: { id: input.postId, deletedAt: null },
          select: { id: true },
        }))
      )
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Beitrag nicht gefunden.",
        });
      const key = { userId: ctx.userId, postId: input.postId };
      if (input.liked)
        await ctx.db.postLike.upsert({
          where: { userId_postId: key },
          create: key,
          update: {},
        });
      else await ctx.db.postLike.deleteMany({ where: key });
      return { liked: input.liked };
    }),
  save: protectedProcedure
    .input(z.object({ postId: z.string(), saved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (
        !(await ctx.db.post.findFirst({
          where: { id: input.postId, deletedAt: null },
          select: { id: true },
        }))
      )
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Beitrag nicht gefunden.",
        });
      const key = { userId: ctx.userId, postId: input.postId };
      if (input.saved)
        await ctx.db.postBookmark.upsert({
          where: { userId_postId: key },
          create: key,
          update: {},
        });
      else await ctx.db.postBookmark.deleteMany({ where: key });
      return { saved: input.saved };
    }),
  comments: protectedProcedure
    .input(z.object({ postId: z.string(), cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (
        !(await ctx.db.post.findFirst({
          where: { id: input.postId, deletedAt: null },
          select: { id: true },
        }))
      )
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Beitrag nicht gefunden.",
        });
      const rows = await ctx.db.comment.findMany({
        where: { postId: input.postId, deletedAt: null },
        include: {
          author: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 21,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      return {
        items: rows.slice(0, 20),
        nextCursor: rows.length > 20 ? rows[19].id : undefined,
      };
    }),
  comment: protectedProcedure
    .input(
      z.object({
        body: z.string().trim().min(1).max(5000),
        postId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        !(await ctx.db.post.findFirst({
          where: { id: input.postId, deletedAt: null },
          select: { id: true },
        }))
      )
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Beitrag nicht gefunden.",
        });
      return ctx.db.comment.create({
        data: { ...input, authorId: ctx.userId },
      });
    }),
  removeComment: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.comment.updateMany({
        where: { id: input.id, authorId: ctx.userId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (!result.count)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kommentar nicht gefunden.",
        });
      return { removed: true };
    }),
  follow: protectedProcedure
    .input(z.object({ userId: z.string(), follow: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Du kannst dir nicht selbst folgen.",
        });
      if (
        input.follow &&
        !(await ctx.db.user.findFirst({
          where: { id: input.userId, publicProfile: true },
          select: { id: true },
        }))
      )
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profil nicht verfügbar.",
        });
      const key = { followerId: ctx.userId, followingId: input.userId };
      if (input.follow)
        await ctx.db.follow.upsert({
          where: { followerId_followingId: key },
          create: key,
          update: {},
        });
      else await ctx.db.follow.deleteMany({ where: key });
      return { following: input.follow };
    }),
  report: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        reason: z.string().trim().min(5).max(1000),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.report.create({ data: { ...input, reporterId: ctx.userId } }),
    ),
});
