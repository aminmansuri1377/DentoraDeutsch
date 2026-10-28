import { sampleLessons } from "./sample-lessons";
import type { PrismaClient } from "@prisma/client";
import type { SeedOperation } from "./seed-runner";

const titles = [
  "Endodontologie",
  "Zahnerhaltung",
  "Parodontologie",
  "Kinderzahnheilkunde",
  "Kieferorthopädie",
  "Implantatchirurgie",
  "Implantatprothetik",
  "Festsitzende Prothetik",
  "Dentale Radiologie",
  "Oralchirurgie",
  "Dentcast",
  "Notfälle und Systemerkrankungen",
  "Lokalanästhesie",
  "Isolation",
  "Klinische Kompetenz",
  "Totalprothetik",
  "Rotierende Endodontie",
];
export async function seedDatabase(clientOrRunner: PrismaClient | SeedOperation) {
  const run: SeedOperation = typeof clientOrRunner === "function" ? clientOrRunner : (operation) => operation(clientOrRunner);
  for (const [i, title] of titles.entries()) {
    const slug = `fachgebiet-${i + 1}`;
    const specialty = await run((db) => db.specialty.upsert({
      where: { slug },
      create: {
        slug,
        title,
        description: `Lernpfad für ${title}`,
        position: i + 1,
      },
      update: {},
    }));
    const course = await run((db) => db.course.upsert({
      where: { slug },
      create: {
        slug,
        title,
        description:
          "Fachinhalte werden vor Veröffentlichung redaktionell geprüft.",
        specialtyId: specialty.id,
        status: "DRAFT",
        access: i === 14 ? "PURCHASE" : i > 10 ? "PRO" : "FREE",
      },
      update: {},
    }));
    await run((db) => db.chapter.upsert({
      where: { courseId_position: { courseId: course.id, position: 1 } },
      create: { courseId: course.id, title: "Grundlagen", position: 1 },
      update: {},
    }));
  }
  const sampleSpecialty = await run((db) => db.specialty.upsert({
    where: { slug: "zahnaufbau" },
    create: {
      slug: "zahnaufbau",
      title: "Zahnanatomie",
      description: "Die wichtigsten Grundbegriffe",
      position: 0,
    },
    update: {},
  }));
  const sampleCourse = await run((db) => db.course.upsert({
    where: { slug: "zahnaufbau" },
    create: {
      slug: "zahnaufbau",
      title: "Den Zahn verstehen",
      description: "Drei kurze Beispiellektionen zu den Geweben des Zahns.",
      specialtyId: sampleSpecialty.id,
      status: "PUBLISHED",
    },
    update: {},
  }));
  const sampleChapter = await run((db) => db.chapter.upsert({
    where: { courseId_position: { courseId: sampleCourse.id, position: 1 } },
    create: {
      courseId: sampleCourse.id,
      title: "Von außen nach innen",
      position: 1,
    },
    update: {},
  }));
  for (const [index, sample] of sampleLessons.entries()) {
    const lesson = await run((db) => db.lesson.upsert({
      where: { slug: sample.slug },
      create: {
        chapterId: sampleChapter.id,
        slug: sample.slug,
        title: sample.title,
        position: index + 1,
        estimatedMinutes: 3,
        freePreview: true,
        status: "PUBLISHED",
      },
      update: {},
    }));
    await run((db) => db.lessonBlock.upsert({
      where: { lessonId_position: { lessonId: lesson.id, position: 1 } },
      create: {
        lessonId: lesson.id,
        position: 1,
        text: sample.text,
        sourceUrl: "https://www.mouthhealthy.org/all-topics-a-z/tooth",
      },
      update: {},
    }));
    const question = await run((db) => db.question.upsert({
      where: { lessonId_position: { lessonId: lesson.id, position: 1 } },
      create: {
        lessonId: lesson.id,
        position: 1,
        prompt: sample.prompt,
        explanation: sample.explanation,
      },
      update: {},
    }));
    for (const [oi, text] of sample.options.entries())
      await run((db) => db.answerOption.upsert({
        where: {
          questionId_position: { questionId: question.id, position: oi + 1 },
        },
        create: {
          questionId: question.id,
          position: oi + 1,
          text,
          isCorrect: oi === sample.correct,
        },
        update: {},
      }));
  }
  const specialty = await run((db) => db.specialty.upsert({
    where: { slug: "lernmethodik" },
    create: {
      slug: "lernmethodik",
      title: "Lernen lernen",
      description: "Eine vollständige technische Beispiellektion.",
      position: 100,
    },
    update: {},
  }));
  const course = await run((db) => db.course.upsert({
    where: { slug: "lernmethodik" },
    create: {
      slug: "lernmethodik",
      title: "Dein Einstieg in Dentora",
      description: "Lerne die Plattform mit einer kurzen Einführung kennen.",
      specialtyId: specialty.id,
      status: "PUBLISHED",
    },
    update: {},
  }));
  const chapter = await run((db) => db.chapter.upsert({
    where: { courseId_position: { courseId: course.id, position: 1 } },
    create: {
      courseId: course.id,
      title: "Deine Lernreise beginnt",
      position: 1,
    },
    update: {},
  }));
  const lesson = await run((db) => db.lesson.upsert({
    where: { slug: "willkommen" },
    create: {
      slug: "willkommen",
      title: "So funktioniert dein Lernpfad",
      chapterId: chapter.id,
      position: 1,
      status: "PUBLISHED",
      freePreview: true,
      reviewerName: "Technische Einführung",
      reviewedAt: new Date(),
    },
    update: {},
  }));
  await run((db) => db.lessonBlock.upsert({
    where: { lessonId_position: { lessonId: lesson.id, position: 1 } },
    create: {
      lessonId: lesson.id,
      position: 1,
      text: "Lies die Lernabschnitte und beantworte danach die Fragen. Du bekommst zu jeder Antwort eine Erklärung. Wenn du mindestens 60 Prozent richtig beantwortest, wird die Lektion als abgeschlossen gespeichert. XP gibt es nur beim ersten erfolgreichen Abschluss.",
    },
    update: {},
  }));
  const question = await run((db) => db.question.upsert({
    where: { lessonId_position: { lessonId: lesson.id, position: 1 } },
    create: {
      lessonId: lesson.id,
      position: 1,
      prompt: "Wann bekommst du XP für eine Lektion?",
      explanation:
        "XP werden einmalig beim ersten erfolgreichen Abschluss vergeben.",
      hint: "Fortschritt zählt — wiederholte Gutschriften werden verhindert.",
    },
    update: {},
  }));
  for (const [i, text] of [
    "Beim ersten erfolgreichen Abschluss.",
    "Bei jedem erneuten Öffnen der Lektion.",
  ].entries())
    await run((db) => db.answerOption.upsert({
      where: { questionId_position: { questionId: question.id, position: i } },
      create: {
        questionId: question.id,
        position: i,
        text,
        isCorrect: i === 0,
      },
      update: {},
    }));
  for (const [threshold, title] of [
    [25, "Der erste Schritt"],
    [250, "Wissensdurst"],
    [1000, "Drangeblieben"],
  ] as const)
    await run((db) => db.badge.upsert({
      where: { slug: `xp-${threshold}` },
      create: {
        slug: `xp-${threshold}`,
        title,
        description: `Sammle ${threshold} XP.`,
        category: "XP",
        threshold,
      },
      update: {},
    }));
  for (const [days, price] of [
    [30, 1990],
    [90, 4990],
    [365, 14990],
  ])
    await run((db) => db.product.upsert({
      where: { slug: `pro-${days}` },
      create: {
        slug: `pro-${days}`,
        title: `Dentora Pro · ${days} Tage`,
        description:
          "Zugang zu veröffentlichten Pro-Kursen. Keine automatische Verlängerung.",
        kind: "PRO",
        priceCents: price,
        durationDays: days,
        active: false,
      },
      update: {},
    }));
  for (const period of ["WEEKLY", "MONTHLY"]) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    if (period === "WEEKLY")
      start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    else start.setUTCDate(1);
    const end = new Date(start);
    if (period === "WEEKLY") end.setUTCDate(end.getUTCDate() + 7);
    else end.setUTCMonth(end.getUTCMonth() + 1);
    await run((db) => db.leagueSeason.upsert({
      where: { period_startsAt: { period, startsAt: start } },
      create: { period, startsAt: start, endsAt: end },
      update: {},
    }));
  }
  console.log(
    "Seed complete: 17 draft specialties, 3 anatomy sample lessons and one introduction. No accounts or credentials created.",
  );
}
