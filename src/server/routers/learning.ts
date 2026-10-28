import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { requireLesson } from "../services/access";
import { startLesson, submitAnswer, finishLesson } from "../services/learning";
export const learningRouter = router({
  questionBookmarks: protectedProcedure.query(({ ctx }) =>
    ctx.db.questionBookmark.findMany({
      where: { userId: ctx.userId },
      include: {
        question: { select: { id: true, prompt: true, lessonId: true } },
      },
    }),
  ),
  saveQuestion: protectedProcedure
    .input(z.object({ questionId: z.string(), saved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const question = await ctx.db.question.findUniqueOrThrow({
        where: { id: input.questionId },
      });
      await requireLesson(ctx.db, ctx.userId, question.lessonId);
      const key = { userId: ctx.userId, questionId: input.questionId };
      if (input.saved)
        await ctx.db.questionBookmark.upsert({
          where: { userId_questionId: key },
          create: key,
          update: {},
        });
      else await ctx.db.questionBookmark.deleteMany({ where: key });
      return { saved: input.saved };
    }),
  reportQuestion: protectedProcedure
    .input(
      z.object({ questionId: z.string(), reason: z.string().min(5).max(1000) }),
    )
    .mutation(async ({ ctx, input }) => {
      const q = await ctx.db.question.findUniqueOrThrow({
        where: { id: input.questionId },
      });
      await requireLesson(ctx.db, ctx.userId, q.lessonId);
      return ctx.db.report.create({
        data: { ...input, reporterId: ctx.userId },
      });
    }),

  catalog: protectedProcedure.query(({ ctx }) =>
    ctx.db.course.findMany({
      where: { status: "PUBLISHED" },
      include: {
        specialty: true,
        chapters: {
          orderBy: { position: "asc" },
          include: {
            lessons: {
              where: { status: "PUBLISHED" },
              orderBy: { position: "asc" },
              select: {
                id: true,
                title: true,
                slug: true,
                position: true,
                estimatedMinutes: true,
                freePreview: true,
                progress: {
                  where: { userId: ctx.userId },
                  select: { completedAt: true },
                },
              },
            },
          },
        },
      },
      orderBy: { specialty: { position: "asc" } },
    }),
  ),
  lesson: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireLesson(ctx.db, ctx.userId, input.id);
      return ctx.db.lesson.findUniqueOrThrow({
        where: { id: input.id },
        select: {
          id: true,
          title: true,
          blocks: { orderBy: { position: "asc" } },
          questions: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              prompt: true,
              kind: true,
              hint: true,
              options: {
                orderBy: { position: "asc" },
                select: { id: true, text: true },
              },
            },
          },
        },
      });
    }),
  start: protectedProcedure
    .input(z.object({ lessonId: z.string() }))
    .mutation(({ ctx, input }) => startLesson(ctx.userId, input.lessonId)),
  answer: protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        questionId: z.string(),
        optionId: z.string(),
      }),
    )
    .mutation(({ ctx, input }) =>
      submitAnswer(
        ctx.userId,
        input.attemptId,
        input.questionId,
        input.optionId,
      ),
    ),
  finish: protectedProcedure
    .input(z.object({ attemptId: z.string() }))
    .mutation(({ ctx, input }) => finishLesson(ctx.userId, input.attemptId)),
  bookmark: protectedProcedure
    .input(z.object({ lessonId: z.string(), saved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await requireLesson(ctx.db, ctx.userId, input.lessonId);
      const key = { userId: ctx.userId, lessonId: input.lessonId };
      return input.saved
        ? ctx.db.lessonBookmark.upsert({
            where: { userId_lessonId: key },
            create: key,
            update: {},
          })
        : ctx.db.lessonBookmark.deleteMany({ where: key });
    }),
  saved: protectedProcedure.query(({ ctx }) =>
    ctx.db.lessonBookmark.findMany({
      where: { userId: ctx.userId },
      include: { lesson: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ),
  highlight: protectedProcedure
    .input(
      z.object({
        blockId: z.string(),
        quote: z.string().min(1).max(1000),
        note: z.string().max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const block = await ctx.db.lessonBlock.findUniqueOrThrow({
        where: { id: input.blockId },
      });
      await requireLesson(ctx.db, ctx.userId, block.lessonId);
      return ctx.db.highlight.create({
        data: { ...input, userId: ctx.userId },
      });
    }),
  highlights: protectedProcedure.query(({ ctx }) =>
    ctx.db.highlight.findMany({
      where: { userId: ctx.userId },
      include: { block: { select: { lessonId: true } } },
    }),
  ),
  review: protectedProcedure.query(({ ctx }) =>
    ctx.db.reviewCard.findMany({
      where: { userId: ctx.userId, dueAt: { lte: new Date() } },
      include: {
        question: { select: { id: true, prompt: true, lessonId: true } },
      },
      take: 50,
    }),
  ),
});
