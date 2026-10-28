import { courseImportSchema } from "@/features/admin/content-schema";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../trpc";
export const adminRouter = router({
  specialties: adminProcedure.query(({ ctx }) =>
    ctx.db.specialty.findMany({ orderBy: { position: "asc" } }),
  ),
  importCourse: adminProcedure
    .input(courseImportSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(
        async (tx) => {
          const course = await tx.course.create({
            data: {
              slug: input.slug,
              title: input.title,
              description: input.description,
              specialtyId: input.specialtyId,
              access: input.access,
              status: "DRAFT",
            },
          });
          for (const [ci, c] of input.chapters.entries()) {
            const chapter = await tx.chapter.create({
              data: {
                courseId: course.id,
                title: c.title,
                guide: c.guide,
                position: ci + 1,
              },
            });
            for (const [li, l] of c.lessons.entries()) {
              const lesson = await tx.lesson.create({
                data: {
                  chapterId: chapter.id,
                  slug: l.slug,
                  title: l.title,
                  position: li + 1,
                  estimatedMinutes: l.estimatedMinutes,
                  freePreview: l.freePreview,
                  status: "REVIEW",
                },
              });
              for (const [bi, b] of l.blocks.entries())
                await tx.lessonBlock.create({
                  data: { lessonId: lesson.id, position: bi + 1, ...b },
                });
              for (const [qi, q] of l.questions.entries()) {
                const { options, ...data } = q;
                await tx.question.create({
                  data: {
                    lessonId: lesson.id,
                    position: qi + 1,
                    ...data,
                    options: {
                      create: options.map((o, i) => ({
                        ...o,
                        position: i + 1,
                      })),
                    },
                  },
                });
              }
            }
          }
          await tx.auditLog.create({
            data: {
              actorId: ctx.userId,
              action: "COURSE_IMPORTED",
              entityId: course.id,
            },
          });
          return course;
        },
        { timeout: 60000 },
      );
    }),
  publishCourse: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const remaining = await ctx.db.lesson.count({
        where: {
          chapter: { courseId: input.id },
          status: { not: "PUBLISHED" },
        },
      });
      const total = await ctx.db.lesson.count({
        where: { chapter: { courseId: input.id } },
      });
      if (remaining || !total)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Zuerst alle Lektionen fachlich prüfen und freigeben.",
        });
      return ctx.db.course.update({
        where: { id: input.id },
        data: { status: "PUBLISHED" },
      });
    }),
  overview: adminProcedure.query(async ({ ctx }) => ({
    users: await ctx.db.user.count(),
    lessons: await ctx.db.lesson.count(),
    reports: await ctx.db.report.count({ where: { status: "OPEN" } }),
    tickets: await ctx.db.ticket.count({ where: { status: "OPEN" } }),
  })),
  lessons: adminProcedure.query(({ ctx }) =>
    ctx.db.lesson.findMany({
      include: { chapter: { include: { course: true } } },
      orderBy: { slug: "asc" },
      take: 300,
    }),
  ),
  publish: adminProcedure
    .input(
      z.object({ id: z.string(), reviewerName: z.string().min(3).max(100) }),
    )
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.db.lesson.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          blocks: true,
          questions: { include: { options: true } },
        },
      });
      if (
        !lesson.blocks.length ||
        !lesson.questions.length ||
        lesson.questions.some(
          (q) => q.options.filter((a) => a.isCorrect).length !== 1,
        )
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Inhalt und genau eine richtige Antwort pro Frage erforderlich.",
        });
      return ctx.db.$transaction([
        ctx.db.lesson.update({
          where: { id: input.id },
          data: {
            status: "PUBLISHED",
            reviewedAt: new Date(),
            reviewerName: input.reviewerName,
            version: { increment: 1 },
          },
        }),
        ctx.db.auditLog.create({
          data: {
            actorId: ctx.userId,
            action: "LESSON_PUBLISHED",
            entityId: input.id,
          },
        }),
      ]);
    }),
  reports: adminProcedure.query(({ ctx }) =>
    ctx.db.report.findMany({
      where: { status: "OPEN" },
      include: { post: true },
      take: 100,
    }),
  ),
  resolve: adminProcedure
    .input(z.object({ id: z.string(), hidePost: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.db.report.findUniqueOrThrow({
        where: { id: input.id },
      });
      if (input.hidePost && report.postId)
        await ctx.db.post.update({
          where: { id: report.postId },
          data: { deletedAt: new Date() },
        });
      return ctx.db.report.update({
        where: { id: input.id },
        data: { status: "RESOLVED" },
      });
    }),
});
