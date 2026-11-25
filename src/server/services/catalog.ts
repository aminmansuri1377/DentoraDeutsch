import "server-only";
import type { Prisma } from "@prisma/client";

/** A user-scoped, compact catalog shared by SSR and tRPC. Do not cache across users. */
export async function getLearningCatalog(
  db: Prisma.TransactionClient,
  userId: string,
) {
  const startedAt = performance.now();
  const courses = await db.course.findMany({
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
              progress: {
                where: { userId },
                select: { completedAt: true },
              },
            },
          },
        },
      },
    },
  });

  if (process.env.DENTORA_PERF_LOG === "true") {
    console.info("[dentora:perf] learning.catalog", {
      durationMs: Math.round(performance.now() - startedAt),
      courseCount: courses.length,
    });
  }
  return courses;
}

export type LearningCatalog = Awaited<ReturnType<typeof getLearningCatalog>>;
