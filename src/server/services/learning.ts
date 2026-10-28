import { TRPCError } from "@trpc/server";
import { setTimeout as delay } from "node:timers/promises";
import { atomic } from "../transaction";
import { requireLesson } from "./access";
import {
  dayKey,
  nextStreak,
  regenerateHearts,
  RULES,
  scoreAnswers,
} from "@/features/gamification/rules";
export async function startLesson(userId: string, lessonId: string) {
  return atomic(async (tx) => {
    const { lesson, pro } = await requireLesson(tx, userId, lessonId);
    const now = new Date();
    const existing = await tx.attempt.findFirst({
      where: {
        userId,
        lessonId,
        completedAt: null,
        expiresAt: { gt: now },
        lessonVersion: lesson.version,
      },
      orderBy: { startedAt: "desc" },
    });
    if (existing) {
      const answers = await tx.attemptAnswer.findMany({
        where: { attemptId: existing.id },
        select: {
          questionId: true,
          optionId: true,
          correct: true,
          question: { select: { explanation: true } },
        },
      });
      return {
        ...existing,
        answers: answers.map(({ question, ...answer }) => ({
          ...answer,
          explanation: question.explanation,
        })),
      };
    }
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const day = dayKey(now, user.timezone);
    const daily = await tx.attempt.count({
      where: {
        userId,
        startedAt: { gte: new Date(now.getTime() - 24 * 3600000) },
      },
    });
    // Rolling 24-hour free allowance deliberately prevents timezone-switch abuse.
    if (!pro && daily >= RULES.freeDailyLessons)
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Dein Tageslimit ist erreicht. Morgen geht es weiter.",
      });
    const game = await tx.gameState.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    const regenerated = regenerateHearts(
      game.hearts,
      game.heartsUpdatedAt,
      now,
      pro ? RULES.proHearts : RULES.freeHearts,
    );
    await tx.gameState.update({ where: { userId }, data: regenerated });
    if (regenerated.hearts < 1)
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Du brauchst ein Herz. Es regeneriert sich automatisch.",
      });
    await tx.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: lesson.chapter.courseId } },
      create: { userId, courseId: lesson.chapter.courseId },
      update: {},
    });
    const attempt = await tx.attempt.create({
      data: {
        userId,
        lessonId,
        lessonVersion: lesson.version,
        expiresAt: new Date(now.getTime() + 3600000),
      },
    });
    return { ...attempt, answers: [] };
  });
}
export async function submitAnswer(
  userId: string,
  attemptId: string,
  questionId: string,
  optionId: string,
) {
  return atomic(async (tx) => {
    const attempt = await tx.attempt.findFirst({
      where: {
        id: attemptId,
        userId,
        completedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!attempt)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Diese Sitzung ist abgelaufen.",
      });
    const { lesson } = await requireLesson(tx, userId, attempt.lessonId);
    if (lesson.version !== attempt.lessonVersion)
      throw new TRPCError({
        code: "CONFLICT",
        message: "Die Lektion wurde aktualisiert. Bitte neu starten.",
      });
    const questions = await tx.question.findMany({
      where: { lessonId: attempt.lessonId },
      orderBy: { position: "asc" },
      include: { options: true },
    });
    const answered = await tx.attemptAnswer.findMany({ where: { attemptId } });
    const previous = answered.find((a) => a.questionId === questionId);
    const question = questions.find((q) => q.id === questionId);
    if (!question) throw new TRPCError({ code: "BAD_REQUEST" });
    if (previous) {
      if (previous.optionId !== optionId)
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Diese Frage wurde bereits beantwortet. Öffne die Lektion erneut, um deine gespeicherte Antwort zu sehen.",
        });
      return {
        optionId: previous.optionId,
        correct: previous.correct,
        explanation: question.explanation,
      };
    }
    const next = questions.find(
      (q) => !answered.some((a) => a.questionId === q.id),
    );
    if (next?.id !== questionId)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Bitte beantworte die Fragen der Reihe nach.",
      });
    const option = question.options.find((o) => o.id === optionId);
    if (!option) throw new TRPCError({ code: "BAD_REQUEST" });
    const state = await tx.gameState.findUniqueOrThrow({ where: { userId } });
    if (state.hearts < 1)
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Keine Herzen verfügbar.",
      });
    await tx.attemptAnswer.create({
      data: { attemptId, questionId, optionId, correct: option.isCorrect },
    });
    if (!option.isCorrect) {
      await tx.gameState.update({
        where: { userId },
        data: { hearts: { decrement: 1 } },
      });
      await tx.reviewCard.upsert({
        where: { userId_questionId: { userId, questionId } },
        create: { userId, questionId },
        update: { dueAt: new Date(), intervalDays: 1 },
      });
    }
    return {
      optionId: option.id,
      correct: option.isCorrect,
      explanation: question.explanation,
    };
  });
}
export async function finishLesson(userId: string, attemptId: string) {
  // Finishing is idempotent: completedAt and rewards are committed atomically.
  // A lost acknowledgement may therefore be retried without granting XP twice.
  for (let retry = 0; ; retry++) {
    try {
      return await completeLesson(userId, attemptId);
    } catch (error) {
      const cause = error instanceof TRPCError ? error.cause : undefined;
      const code = (cause as { code?: string } | undefined)?.code;
      if (retry >= 2 || !["P1017", "P1001"].includes(code ?? "")) throw error;
      await delay(300 * 2 ** retry);
    }
  }
}
async function completeLesson(userId: string, attemptId: string) {
  return atomic(async (tx) => {
    const attempt = await tx.attempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        answers: true,
        lesson: { include: { questions: true, chapter: true } },
      },
    });
    if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });
    if (attempt.completedAt)
      return { score: attempt.score, xp: 0, alreadyCompleted: true };
    if (attempt.expiresAt < new Date())
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Sitzung abgelaufen.",
      });
    await requireLesson(tx, userId, attempt.lessonId);
    if (
      attempt.lesson.version !== attempt.lessonVersion ||
      attempt.answers.length !== attempt.lesson.questions.length ||
      !attempt.lesson.questions.length
    )
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Beantworte zuerst alle Fragen.",
      });
    const score = scoreAnswers(attempt.answers);
    const now = new Date();
    await tx.attempt.update({
      where: { id: attemptId },
      data: { completedAt: now, score },
    });
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const day = dayKey(now, user.timezone);
    const passed = score >= 60;
    const prior = await tx.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: attempt.lessonId } },
    });
    const xp =
      passed && !prior
        ? RULES.lessonXp +
          attempt.answers.filter((a) => a.correct).length * RULES.correctXp
        : 0;
    if (passed)
      await tx.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: attempt.lessonId } },
        create: { userId, lessonId: attempt.lessonId, bestScore: score },
        update: { bestScore: Math.max(prior?.bestScore ?? 0, score) },
      });
    const seconds = Math.min(
      900,
      Math.max(
        0,
        Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000),
      ),
    );
    await tx.dailyActivity.upsert({
      where: { userId_day: { userId, day } },
      create: { userId, day, xp, seconds, lessons: passed && !prior ? 1 : 0 },
      update: {
        xp: { increment: xp },
        seconds: { increment: seconds },
        lessons: { increment: passed && !prior ? 1 : 0 },
      },
    });
    if (xp > 0) {
      const game = await tx.gameState.findUniqueOrThrow({ where: { userId } });
      const streak = nextStreak(
        game.lastStudyDay,
        day,
        game.streak,
        game.streakGuards,
      );
      await tx.rewardLedger.create({
        data: {
          userId,
          key: `lesson:${userId}:${attempt.lessonId}`,
          xp,
          reason: "LESSON",
        },
      });
      await tx.gameState.update({
        where: { userId },
        data: {
          xp: { increment: xp },
          streak: streak.streak,
          streakGuards: streak.guards,
          lastStudyDay: day,
        },
      });
      for (const season of await tx.leagueSeason.findMany({
        where: { startsAt: { lte: now }, endsAt: { gt: now }, settledAt: null },
      }))
        await tx.leagueEntry.upsert({
          where: { seasonId_userId: { seasonId: season.id, userId } },
          create: { seasonId: season.id, userId, xp },
          update: { xp: { increment: xp } },
        });
      for (const badge of await tx.badge.findMany({
        where: { category: "XP", threshold: { lte: game.xp + xp } },
      }))
        await tx.userBadge.upsert({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
          create: { userId, badgeId: badge.id },
          update: {},
        });
      const remaining = await tx.lesson.count({
        where: {
          status: "PUBLISHED",
          chapter: { courseId: attempt.lesson.chapter.courseId },
          progress: { none: { userId } },
        },
      });
      if (remaining === 0) {
        const course = await tx.course.findUniqueOrThrow({
          where: { id: attempt.lesson.chapter.courseId },
        });
        await tx.certificate.upsert({
          where: { userId_courseId: { userId, courseId: course.id } },
          create: {
            userId,
            courseId: course.id,
            nameSnapshot: user.name ?? "Lernende Person",
            courseSnapshot: course.title,
          },
          update: {},
        });
      }
    }
    return { score, xp, alreadyCompleted: false };
  });
}
