import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
const postInput = z.object({ body: z.string().trim().min(1).max(5000) });
export const socialRouter = router({
  feed: protectedProcedure
    .input(
      z.object({
        filter: z.enum(["all", "mine", "saved"]).default("all"),
        search: z.string().max(100).default(""),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.post.findMany({
        where: {
          deletedAt: null,
          body: { contains: input.search, mode: "insensitive" },
          ...(input.filter === "mine" ? { authorId: ctx.userId } : {}),
          ...(input.filter === "saved"
            ? { bookmarks: { some: { userId: ctx.userId } } }
            : {}),
        },
        include: {
          author: { select: { id: true, name: true, username: true } },
          _count: { select: { likes: true, comments: true } },
          likes: {
            where: { userId: ctx.userId },
            select: { id: true },
          },
          bookmarks: {
            where: { userId: ctx.userId },
            select: { id: true },
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
  create: protectedProcedure
    .input(postInput)
    .mutation(({ ctx, input }) =>
      ctx.db.post.create({ data: { ...input, authorId: ctx.userId } }),
    ),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.post.updateMany({
        where: { id: input.id, authorId: ctx.userId },
        data: { deletedAt: new Date() },
      }),
    ),
  like: protectedProcedure
    .input(z.object({ postId: z.string(), liked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.findFirst({
        where: { id: input.postId, deletedAt: null },
      });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      const key = { userId: ctx.userId, postId: input.postId };
      return input.liked
        ? ctx.db.postLike.upsert({
            where: { userId_postId: key },
            create: key,
            update: {},
          })
        : ctx.db.postLike.deleteMany({ where: key });
    }),
  save: protectedProcedure
    .input(z.object({ postId: z.string(), saved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const key = { userId: ctx.userId, postId: input.postId };
      return input.saved
        ? ctx.db.postBookmark.upsert({
            where: { userId_postId: key },
            create: key,
            update: {},
          })
        : ctx.db.postBookmark.deleteMany({ where: key });
    }),
  comments: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.comment.findMany({
        where: { postId: input.postId, deletedAt: null },
        include: { author: { select: { name: true, username: true } } },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
    ),
  comment: protectedProcedure
    .input(postInput.extend({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (
        !(await ctx.db.post.findFirst({
          where: { id: input.postId, deletedAt: null },
        }))
      )
        throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.comment.create({
        data: { ...input, authorId: ctx.userId },
      });
    }),
  follow: protectedProcedure
    .input(z.object({ userId: z.string(), follow: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId)
        throw new TRPCError({ code: "BAD_REQUEST" });
      const key = { followerId: ctx.userId, followingId: input.userId };
      return input.follow
        ? ctx.db.follow.upsert({
            where: { followerId_followingId: key },
            create: key,
            update: {},
          })
        : ctx.db.follow.deleteMany({ where: key });
    }),
  report: protectedProcedure
    .input(
      z.object({ postId: z.string(), reason: z.string().min(5).max(1000) }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.report.create({ data: { ...input, reporterId: ctx.userId } }),
    ),
});
