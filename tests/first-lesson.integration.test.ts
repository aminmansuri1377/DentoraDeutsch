import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { importFirstLesson } from "../prisma/import-first-lesson";
const state = vi.hoisted(() => ({ db: null as unknown as PrismaClient }));
vi.mock("@/server/db", () => ({
  get db() {
    return state.db;
  },
}));
vi.mock("@/server/auth", () => ({ auth: async () => null }));
import {
  startLesson,
  submitAnswer,
  finishLesson,
} from "@/server/services/learning";
import { appRouter } from "@/server/routers";
let pg: PGlite, lessonId: string;
beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(
    readFileSync(
      "prisma/migrations/202610280001_initial/migration.sql",
      "utf8",
    ),
  );
  await pg.exec(
    readFileSync(
      "prisma/migrations/202611040001_letter_questions/migration.sql",
      "utf8",
    ),
  );
  state.db = new PrismaClient({ adapter: new PrismaPGlite(pg) });
  lessonId = await importFirstLesson((fn) => fn(state.db));
});
afterAll(async () => {
  await state.db.$disconnect();
  await pg.close();
});
it("imports exactly two pages and five questions without duplicating or resetting content", async () => {
  await importFirstLesson((fn) => fn(state.db));
  expect(await state.db.lessonBlock.count({ where: { lessonId } })).toBe(2);
  expect(await state.db.question.count({ where: { lessonId } })).toBe(5);
  expect(await state.db.lesson.count()).toBe(1);
});
it("grades letter answers on the server, preserves a wrong answer and completes once", async () => {
  const user = await state.db.user.create({
    data: { email: "letters@example.com" },
  });
  const attempt = await startLesson(user.id, lessonId);
  const questions = await state.db.question.findMany({
    where: { lessonId },
    orderBy: { position: "asc" },
    include: { options: true },
  });
  for (const q of questions.slice(0, 4))
    expect(
      (
        await submitAnswer(
          user.id,
          attempt.id,
          q.id,
          q.options.find((o) => o.isCorrect)!.id,
        )
      ).correct,
    ).toBe(true);
  const q = questions[4];
  // Even knowing the correct option id cannot forge correctness for a letter question.
  const wrong = await submitAnswer(
    user.id,
    attempt.id,
    q.id,
    q.options[0].id,
    "FALSCH",
  );
  expect(wrong.correct).toBe(false);
  expect(
    (await submitAnswer(user.id, attempt.id, q.id, "", "FALSCH")).correct,
  ).toBe(false);
  await expect(
    submitAnswer(user.id, attempt.id, q.id, "", "ZELLREICHE"),
  ).rejects.toMatchObject({ code: "CONFLICT" });
  const resumed = await startLesson(user.id, lessonId);
  expect(
    resumed.answers.find((a) => a.questionId === q.id)?.submittedText,
  ).toBe("FALSCH");
  const result = await finishLesson(user.id, attempt.id);
  expect(result.score).toBe(80);
  const again = await finishLesson(user.id, attempt.id);
  expect(again.score).toBe(80);
});
it("accepts a correctly ordered word and never exposes the solution order in the lesson API", async () => {
  const user = await state.db.user.create({
    data: { email: "correct-letters@example.com" },
  });
  const caller = appRouter.createCaller({
    db: state.db,
    session: { user: { id: user.id } },
    userId: user.id,
  } as never);
  const publicLesson = await caller.learning.lesson({ id: lessonId });
  const letterQuestion = publicLesson.questions[4];
  expect(letterQuestion.options).toEqual([]);
  expect(letterQuestion.letters?.join("")).not.toBe("ZELLREICHE");
  expect(JSON.stringify(publicLesson)).not.toContain("isCorrect");
  const attempt = await startLesson(user.id, lessonId);
  const qs = await state.db.question.findMany({
    where: { lessonId },
    orderBy: { position: "asc" },
    include: { options: true },
  });
  for (const q of qs.slice(0, 4))
    await submitAnswer(
      user.id,
      attempt.id,
      q.id,
      q.options.find((o) => o.isCorrect)!.id,
    );
  expect(
    (await submitAnswer(user.id, attempt.id, qs[4].id, "", "zellreiche"))
      .correct,
  ).toBe(true);
});

it("imports all 17 categories without duplicating content or making empty lessons playable", async () => {
  const { importLearningPaths } =
    await import("../prisma/import-learning-paths");
  const run = <T>(fn: (db: PrismaClient) => Promise<T>) => fn(state.db);
  await importLearningPaths(run);
  const before = {
    courses: await state.db.course.count(),
    lessons: await state.db.lesson.count(),
  };
  await importLearningPaths(run);
  expect(await state.db.course.count()).toBe(before.courses);
  expect(before.courses).toBe(17);
  expect(await state.db.lesson.count()).toBe(before.lessons);
  expect(await state.db.lesson.count({ where: { status: "PUBLISHED" } })).toBe(
    1,
  );
  expect(await state.db.question.count({ where: { lessonId } })).toBe(5);
  const user = await state.db.user.create({
    data: { email: "path-locks@example.com" },
  });
  const first = await state.db.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    include: { chapter: true },
  });
  const chapter = await state.db.chapter.create({
    data: {
      courseId: first.chapter.courseId,
      position: 2,
      title: "Next chapter",
    },
  });
  const next = await state.db.lesson.create({
    data: {
      chapterId: chapter.id,
      position: 1,
      title: "Next lesson",
      slug: "test-next-chapter",
      status: "PUBLISHED",
      freePreview: true,
    },
  });
  const { requireLesson } = await import("../src/server/services/access");
  await expect(requireLesson(state.db, user.id, next.id)).rejects.toMatchObject(
    { code: "FORBIDDEN" },
  );
  const earlier = await state.db.lesson.findMany({
    where: { chapterId: first.chapterId },
  });
  for (const previous of earlier) {
    await state.db.lesson.update({
      where: { id: previous.id },
      data: { status: "PUBLISHED" },
    });
    await state.db.lessonProgress.create({
      data: { userId: user.id, lessonId: previous.id, bestScore: 100 },
    });
  }
  await expect(
    requireLesson(state.db, user.id, next.id),
  ).resolves.toHaveProperty("lesson.id", next.id);
});
