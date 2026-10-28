import { beforeAll, afterAll, it, expect, vi } from "vitest";
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
import { seedDatabase } from "../prisma/seed-data";
import {
  startLesson,
  submitAnswer,
  finishLesson,
} from "@/server/services/learning";
let pg: PGlite;
beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(
    readFileSync(
      "prisma/migrations/202610280001_initial/migration.sql",
      "utf8",
    ),
  );
  state.db = new PrismaClient({ adapter: new PrismaPGlite(pg) });
  await seedDatabase(state.db);
});
afterAll(async () => {
  await state.db.$disconnect();
  await pg.close();
});
async function fixture(email: string) {
  const user = await state.db.user.create({ data: { email } });
  const lesson = await state.db.lesson.findFirstOrThrow({
    where: { chapter: { course: { slug: "zahnaufbau" } }, position: 1 },
    include: { questions: { include: { options: true } } },
  });
  return { user, lesson, question: lesson.questions[0] };
}
it("rejects changing a recorded answer and resumes the original answer", async () => {
  const { user, lesson, question } = await fixture("resume@example.com");
  const attempt = await startLesson(user.id, lesson.id);
  const correct = question.options.find((o) => o.isCorrect)!;
  const wrong = question.options.find((o) => !o.isCorrect)!;
  await submitAnswer(user.id, attempt.id, question.id, correct.id);
  await expect(
    submitAnswer(user.id, attempt.id, question.id, wrong.id),
  ).rejects.toMatchObject({ code: "CONFLICT" });
  const resumed = await startLesson(user.id, lesson.id);
  expect(resumed.id).toBe(attempt.id);
  expect(resumed.answers).toEqual([
    expect.objectContaining({ optionId: correct.id, correct: true }),
  ]);
  expect((await finishLesson(user.id, attempt.id)).xp).toBe(25);
});
it("grades an incorrect option false and finishes without granting progress or XP", async () => {
  const { user, lesson, question } = await fixture("wrong@example.com");
  const attempt = await startLesson(user.id, lesson.id);
  const wrong = question.options.find((o) => !o.isCorrect)!;
  expect(
    await submitAnswer(user.id, attempt.id, question.id, wrong.id),
  ).toMatchObject({ correct: false, optionId: wrong.id });
  expect(await finishLesson(user.id, attempt.id)).toMatchObject({
    score: 0,
    xp: 0,
  });
  expect(
    await state.db.lessonProgress.count({ where: { userId: user.id } }),
  ).toBe(0);
  expect(
    (await state.db.gameState.findUniqueOrThrow({ where: { userId: user.id } }))
      .hearts,
  ).toBe(4);
});
it("completes a seeded course with leagues, badges and certificate exactly once", async () => {
  const user = await state.db.user.create({
    data: { email: "complete@example.com" },
  });
  const lessons = await state.db.lesson.findMany({
    where: { chapter: { course: { slug: "zahnaufbau" } } },
    orderBy: { position: "asc" },
    include: { questions: { include: { options: true } } },
  });
  for (const lesson of lessons) {
    const attempt = await startLesson(user.id, lesson.id);
    for (const q of lesson.questions)
      await submitAnswer(
        user.id,
        attempt.id,
        q.id,
        q.options.find((o) => o.isCorrect)!.id,
      );
    expect((await finishLesson(user.id, attempt.id)).xp).toBe(25);
    expect((await finishLesson(user.id, attempt.id)).xp).toBe(0);
  }
  expect(await state.db.certificate.count({ where: { userId: user.id } })).toBe(
    1,
  );
  expect(await state.db.userBadge.count({ where: { userId: user.id } })).toBe(
    1,
  );
  const entries = await state.db.leagueEntry.findMany({
    where: { userId: user.id },
  });
  expect(entries).toHaveLength(2);
  expect(entries.every((e) => e.xp === 75)).toBe(true);
});
it("retries finish safely when the commit succeeded but its acknowledgement was lost", async () => {
  const { user, lesson, question } = await fixture("lost-ack@example.com");
  const attempt = await startLesson(user.id, lesson.id);
  await submitAnswer(
    user.id,
    attempt.id,
    question.id,
    question.options.find((o) => o.isCorrect)!.id,
  );
  const original = state.db.$transaction.bind(state.db);
  const spy = vi.spyOn(state.db, "$transaction");
  spy.mockImplementationOnce(async (...args: unknown[]) => {
    await (original as (...args: unknown[]) => Promise<unknown>)(...args);
    const { Prisma } = await import("@prisma/client");
    throw new Prisma.PrismaClientKnownRequestError(
      "Lost connection after commit",
      { code: "P1017", clientVersion: "7.10.1" },
    );
  });
  try {
    expect((await finishLesson(user.id, attempt.id)).score).toBe(100);
    expect(
      await state.db.rewardLedger.count({ where: { userId: user.id } }),
    ).toBe(1);
    expect(
      (
        await state.db.gameState.findUniqueOrThrow({
          where: { userId: user.id },
        })
      ).xp,
    ).toBe(25);
  } finally {
    spy.mockRestore();
  }
});
