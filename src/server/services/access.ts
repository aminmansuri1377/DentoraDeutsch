import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
export async function accessFor(
  tx: Prisma.TransactionClient,
  userId: string,
  courseId: string,
) {
  const now = new Date();
  const grants = await tx.entitlement.findMany({
    where: {
      userId,
      revokedAt: null,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
  });
  return {
    pro: grants.some((g) => g.courseId === null),
    purchased: grants.some((g) => g.courseId === courseId),
  };
}
export async function requireLesson(
  tx: Prisma.TransactionClient,
  userId: string,
  lessonId: string,
) {
  const lesson = await tx.lesson.findFirst({
    where: {
      id: lessonId,
      status: "PUBLISHED",
      chapter: { course: { status: "PUBLISHED" } },
    },
    include: { chapter: { include: { course: true } } },
  });
  if (!lesson)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Lektion nicht verfügbar.",
    });
  const access = await accessFor(tx, userId, lesson.chapter.courseId);
  if (
    !lesson.freePreview &&
    ((lesson.chapter.course.access === "PRO" && !access.pro) ||
      (lesson.chapter.course.access === "PURCHASE" && !access.purchased))
  )
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Für diese Lektion brauchst du einen Kurszugang.",
    });
  // Completed lessons remain replayable. Unfinished lessons unlock in course order,
  // including across chapter boundaries; planned reference lessons are barriers.
  const completed = await tx.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  const incompleteBefore = completed
    ? null
    : await tx.lesson.findFirst({
        where: {
          chapter: { courseId: lesson.chapter.courseId },
          AND: [
            {
              OR: [
                { status: "PUBLISHED" },
                { status: "DRAFT", slug: { startsWith: "dentigo-path-" } },
              ],
            },
            {
              OR: [
                { chapter: { position: { lt: lesson.chapter.position } } },
                {
                  chapterId: lesson.chapterId,
                  position: { lt: lesson.position },
                },
              ],
            },
          ],
          progress: { none: { userId } },
        },
        select: { id: true },
      });
  if (incompleteBefore)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Schließe zuerst die vorherigen Lektionen ab.",
    });
  return { lesson, ...access };
}
