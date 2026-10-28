import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";
const state = vi.hoisted(() => ({ db: null as unknown as PrismaClient }));
vi.mock("@/server/db", () => ({
  get db() {
    return state.db;
  },
}));
import {
  startLesson,
  submitAnswer,
  finishLesson,
} from "@/server/services/learning";
import { appRouter } from "@/server/routers";
vi.mock("@/server/auth", () => ({ auth: async () => null }));
let pg: PGlite,
  userId: string,
  otherId: string,
  lessonId: string,
  questionId: string,
  optionId: string;
beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(
    readFileSync(
      "prisma/migrations/202610280001_initial/migration.sql",
      "utf8",
    ),
  );
  state.db = new PrismaClient({ adapter: new PrismaPGlite(pg) });
  const user = await state.db.user.create({
    data: { email: "test@example.com", name: "Test" },
  });
  userId = user.id;
  otherId = (
    await state.db.user.create({ data: { email: "other@example.com" } })
  ).id;
  const specialty = await state.db.specialty.create({
    data: { slug: "test", title: "Test", description: "Test", position: 1 },
  });
  const course = await state.db.course.create({
    data: {
      slug: "test",
      title: "Test",
      description: "Test",
      specialtyId: specialty.id,
      status: "PUBLISHED",
    },
  });
  const chapter = await state.db.chapter.create({
    data: { courseId: course.id, title: "Test", position: 1 },
  });
  const lesson = await state.db.lesson.create({
    data: {
      slug: "test",
      title: "Test",
      chapterId: chapter.id,
      position: 1,
      status: "PUBLISHED",
    },
  });
  lessonId = lesson.id;
  const question = await state.db.question.create({
    data: {
      lessonId,
      position: 1,
      prompt: "Test?",
      explanation: "Explanation",
    },
  });
  questionId = question.id;
  optionId = (
    await state.db.answerOption.create({
      data: { questionId, text: "Correct", isCorrect: true, position: 1 },
    })
  ).id;
});
afterAll(async () => {
  await state.db?.$disconnect();
  await pg?.close();
});
describe("PostgreSQL-backed learning security", () => {
  it("denies anonymous access to private procedures", async () => {
    const caller = appRouter.createCaller({ db: state.db, session: null });
    await expect(caller.profile.me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
  it("does not expose answer keys to the client", async () => {
    const caller = appRouter.createCaller({
      db: state.db,
      session: {
        user: { id: userId },
        expires: new Date(Date.now() + 10000).toISOString(),
      },
    });
    const response = await caller.learning.lesson({ id: lessonId });
    expect(JSON.stringify(response)).not.toContain("isCorrect");
    expect(JSON.stringify(response)).not.toContain("Explanation");
  });
  it("prevents completion without answers and access to another user attempt", async () => {
    const attempt = await startLesson(userId, lessonId);
    await expect(finishLesson(userId, attempt.id)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      submitAnswer(otherId, attempt.id, questionId, optionId),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("awards XP once even when finish and answers are retried", async () => {
    const attempt = await startLesson(userId, lessonId);
    expect(
      (await submitAnswer(userId, attempt.id, questionId, optionId)).correct,
    ).toBe(true);
    await submitAnswer(userId, attempt.id, questionId, optionId);
    expect(await state.db.attemptAnswer.count()).toBe(1);
    expect((await finishLesson(userId, attempt.id)).xp).toBe(25);
    expect((await finishLesson(userId, attempt.id)).xp).toBe(0);
    expect(
      (await state.db.gameState.findUniqueOrThrow({ where: { userId } })).xp,
    ).toBe(25);
    expect(await state.db.rewardLedger.count()).toBe(1);
  });
  it("does not reward replay of a completed lesson", async () => {
    const attempt = await startLesson(userId, lessonId);
    await submitAnswer(userId, attempt.id, questionId, optionId);
    expect((await finishLesson(userId, attempt.id)).xp).toBe(0);
    expect(await state.db.lessonProgress.count()).toBe(1);
  });
  it("enforces access on Pro courses and unpublished content", async () => {
    const lesson = await state.db.lesson.findUniqueOrThrow({
      where: { id: lessonId },
      include: { chapter: true },
    });
    await state.db.course.update({
      where: { id: lesson.chapter.courseId },
      data: { access: "PRO" },
    });
    await expect(startLesson(otherId, lessonId)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await state.db.lesson.update({
      where: { id: lessonId },
      data: { status: "DRAFT" },
    });
    await expect(startLesson(userId, lessonId)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
