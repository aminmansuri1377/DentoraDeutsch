import type { SeedOperation } from "./seed-runner";
import { pulpLesson } from "./content/dentigo-744";
/** Isolated content namespace: never overwrites existing lessons, answers or progress. */
export async function importFirstLesson(run: SeedOperation) {
  const specialty = await run((db) =>
    db.specialty.upsert({
      where: { slug: "dentigo-endodontologie" },
      create: {
        slug: "dentigo-endodontologie",
        title: "Endodontologie",
        description: "Biologische Grundlagen: Pulpa und Dentin",
        position: -1,
      },
      update: {},
    }),
  );
  const course = await run((db) =>
    db.course.upsert({
      where: { slug: "dentigo-endodontologie" },
      create: {
        slug: "dentigo-endodontologie",
        specialtyId: specialty.id,
        title: "Endodontologie: Pulpa und Dentin",
        description:
          "Deutsche Übertragung der ersten Lektion des Referenzlernwegs.",
        status: "PUBLISHED",
        access: "FREE",
      },
      update: {},
    }),
  );
  const chapter = await run((db) =>
    db.chapter.upsert({
      where: { courseId_position: { courseId: course.id, position: 1 } },
      create: {
        courseId: course.id,
        position: 1,
        title: "Biologische Grundlagen: der Pulpa-Dentin-Komplex",
      },
      update: {},
    }),
  );
  // Publish only after all content exists. Interrupted imports remain safely hidden.
  const lesson = await run((db) =>
    db.lesson.upsert({
      where: { slug: pulpLesson.slug },
      create: {
        slug: pulpLesson.slug,
        title: pulpLesson.title,
        chapterId: chapter.id,
        position: 1,
        status: "DRAFT",
        freePreview: true,
        estimatedMinutes: 5,
      },
      update: {},
    }),
  );
  for (const [index, block] of pulpLesson.blocks.entries())
    await run((db) =>
      db.lessonBlock.upsert({
        where: {
          lessonId_position: { lessonId: lesson.id, position: index + 1 },
        },
        create: {
          lessonId: lesson.id,
          position: index + 1,
          kind: "STUDY_CARD",
          text: JSON.stringify(block),
          mediaUrl:
            index === 0
              ? "/lessons/pulp-zones.webp"
              : "/lessons/odontoblasts.svg",
          sourceUrl: "https://app.dentigoapp.com/fa/lesson/744",
        },
        update: {},
      }),
    );
  for (const [index, item] of pulpLesson.questions.entries()) {
    const q = await run((db) =>
      db.question.upsert({
        where: {
          lessonId_position: { lessonId: lesson.id, position: index + 1 },
        },
        create: {
          lessonId: lesson.id,
          position: index + 1,
          kind: item.kind,
          prompt: item.prompt,
          explanation: item.explanation,
        },
        update: {},
      }),
    );
    for (const [position, text] of item.options.entries())
      await run((db) =>
        db.answerOption.upsert({
          where: {
            questionId_position: { questionId: q.id, position: position + 1 },
          },
          create: {
            questionId: q.id,
            position: position + 1,
            text,
            isCorrect: position === item.correct,
          },
          update: {},
        }),
      );
  }
  await run((db) =>
    db.lesson.update({
      where: { id: lesson.id },
      data: { status: "PUBLISHED" },
    }),
  );
  return lesson.id;
}
