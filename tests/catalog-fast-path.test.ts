import { expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";

vi.mock("server-only", () => ({}));
import { getLearningCatalog } from "@/server/services/catalog";

it("keeps user completion flags separate without filtering course visibility", async () => {
  const lessons = [
    { id: "l1", title: "One", estimatedMinutes: 3, status: "PUBLISHED" },
    { id: "l2", title: "Two", estimatedMinutes: 5, status: "DRAFT" },
  ];
  const courses = [
    {
      id: "course", slug: "dentigo-path-course", title: "Course", description: "",
      access: "FREE", specialty: { id: "s", title: "Specialty" },
      chapters: [{ id: "c", title: "Chapter", guide: "", lessons }],
    },
  ];
  const findManyCourses = vi.fn().mockResolvedValue(courses);
  const findManyProgress = vi.fn().mockImplementation(({ where }) =>
    Promise.resolve(where.userId === "alice"
      ? [{ lessonId: "l1", completedAt: new Date("2026-01-01T00:00:00Z") }]
      : []),
  );
  const db = {
    course: { findMany: findManyCourses },
    lessonProgress: { findMany: findManyProgress },
  } as unknown as Prisma.TransactionClient;
  const [alice, bob] = await Promise.all([
    getLearningCatalog(db, "alice"),
    getLearningCatalog(db, "bob"),
  ]);

  expect(alice[0].chapters[0].lessons[0].progress).toHaveLength(1);
  expect(bob[0].chapters[0].lessons[0].progress).toEqual([]);
  expect(alice[0].chapters[0].lessons[1].progress).toEqual([]);
  expect(findManyCourses).toHaveBeenCalledTimes(2);
  expect(findManyProgress).toHaveBeenCalledTimes(2);
  expect(lessons[0]).not.toHaveProperty("progress");
});
