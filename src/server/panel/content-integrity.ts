import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
export async function assertPublishable(
  tx: Prisma.TransactionClient,
  lessonId: string,
) {
  const lesson = await tx.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    include: { blocks: true, questions: { include: { options: true } } },
  });
  if (
    !lesson.blocks.length ||
    !lesson.questions.length ||
    lesson.questions.some(
      (q) =>
        q.options.length < 2 ||
        q.options.filter((o) => o.isCorrect).length !== 1,
    )
  )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Zum Veröffentlichen sind Lerninhalte und Fragen mit mindestens zwei Antworten und genau einer richtigen Antwort erforderlich.",
    });
}
export async function relatedLesson(
  tx: Prisma.TransactionClient,
  model: string,
  row: Record<string, unknown>,
) {
  if (model === "Lesson") return String(row.id);
  if (model === "Question" || model === "LessonBlock")
    return String(row.lessonId);
  if (model === "AnswerOption") {
    const question = await tx.question.findUnique({
      where: { id: String(row.questionId) },
      select: { lessonId: true },
    });
    return question?.lessonId;
  }
  return undefined;
}
export async function touchContent(
  tx: Prisma.TransactionClient,
  model: string,
  row: Record<string, unknown>,
  deleted = false,
) {
  if (model === "Lesson" && deleted) return;
  const lessonId = await relatedLesson(tx, model, row);
  if (!lessonId) return;
  const lesson = await tx.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return;
  let status = lesson.status;
  if (status === "PUBLISHED") {
    try {
      await assertPublishable(tx, lessonId);
    } catch (error) {
      if (model === "Lesson" && !deleted) throw error;
      status = "REVIEW";
    }
  }
  await tx.lesson.update({
    where: { id: lessonId },
    data: { version: { increment: 1 }, status },
  });
}
