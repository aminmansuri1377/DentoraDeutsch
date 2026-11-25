import "server-only";
import type { Prisma } from "@prisma/client";

/**
 * Keep published content and personal progress in separate reads. A large
 * nested per-lesson progress relation made the initial catalog SQL expensive.
 * Only the returned completion flags are personalized; nothing is cross-user cached.
 */
export async function getLearningCatalog(
  db: Prisma.TransactionClient,
  userId: string,
) {
  const startedAt = performance.now();
  const [courses, completions] = await Promise.all([
    db.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [
        { specialty: { position: "asc" } },
        { createdAt: "asc" },
        { id: "asc" },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        access: true,
        specialty: { select: { id: true, title: true } },
        chapters: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            guide: true,
            lessons: {
              where: {
                OR: [
                  { status: "PUBLISHED" },
                  { status: "DRAFT", slug: { startsWith: "dentigo-path-" } },
                ],
              },
              orderBy: { position: "asc" },
              select: {
                id: true,
                title: true,
                estimatedMinutes: true,
                status: true,
              },
            },
          },
        },
      },
    }),
    db.lessonProgress.findMany({
      where: { userId },
      select: { lessonId: true, completedAt: true },
    }),
  ]);

  const progressByLesson = new Map(
    completions.map(({ lessonId, completedAt }) => [lessonId, { completedAt }]),
  );
  const result = courses.map((course) => ({
    ...course,
    chapters: course.chapters.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson) => {
        const completed = progressByLesson.get(lesson.id);
        return { ...lesson, progress: completed ? [completed] : [] };
      }),
    })),
  }));

  if (process.env.DENTORA_PERF_LOG === "true") {
    console.info("[dentora:perf] learning.catalog", {
      durationMs: Math.round(performance.now() - startedAt),
      courseCount: result.length,
      completionCount: completions.length,
    });
  }
  return result;
}

export type LearningCatalog = Awaited<ReturnType<typeof getLearningCatalog>>;
