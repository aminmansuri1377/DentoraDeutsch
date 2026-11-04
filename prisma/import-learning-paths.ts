import type { SeedOperation } from "./seed-runner";
import { referencePaths } from "./content/learning-paths";
import { importFirstLesson } from "./import-first-lesson";
/** Safe to resume: never changes published lessons, editorial content or user progress. */
export async function importLearningPaths(run: SeedOperation) {
  await importFirstLesson(run);
  for (const [index, path] of referencePaths.entries()) {
    const slug =
      index === 0 ? "dentigo-endodontologie" : `dentigo-path-${index + 1}`;
    const specialty = await run((db) =>
      db.specialty.upsert({
        where: { slug: index === 0 ? slug : `fachgebiet-${index + 1}` },
        create: {
          slug: `fachgebiet-${index + 1}`,
          title: path.title,
          description: `Lernpfad für ${path.title}`,
          position: index + 1,
        },
        update: {},
      }),
    );
    const course = await run((db) =>
      db.course.upsert({
        where: { slug },
        create: {
          slug,
          specialtyId: specialty.id,
          title: path.title,
          description: `Schritt für Schritt durch ${path.title}.`,
          status: "PUBLISHED",
          access: index === 14 ? "PURCHASE" : index > 10 ? "PRO" : "FREE",
        },
        update: {},
      }),
    );
    if (!path.chapter || !path.lessons) continue;
    const chapter = await run((db) =>
      db.chapter.upsert({
        where: { courseId_position: { courseId: course.id, position: 1 } },
        create: { courseId: course.id, position: 1, title: path.chapter },
        update: {},
      }),
    );
    for (const [lessonIndex, title] of path.lessons.entries()) {
      if (index === 0 && lessonIndex === 0) continue; // Existing, fully playable imported lesson.
      await run((db) =>
        db.lesson.upsert({
          where: {
            chapterId_position: {
              chapterId: chapter.id,
              position: lessonIndex + 1,
            },
          },
          create: {
            chapterId: chapter.id,
            position: lessonIndex + 1,
            slug: `dentigo-path-${index + 1}-1-${lessonIndex + 1}`,
            title,
            status: "DRAFT",
          },
          update: {},
        }),
      );
    }
  }
}
