export const RULES = {
  freeDailyLessons: 4,
  freeHearts: 5,
  proHearts: 20,
  heartIntervalMs: 4 * 60 * 60 * 1000,
  lessonXp: 20,
  correctXp: 5,
  heartCost: 5,
  guardCost: 25,
} as const;
export function dayKey(date: Date, timezone = "Europe/Berlin") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function scoreAnswers(answers: { correct: boolean }[]) {
  return answers.length
    ? Math.round(
        (answers.filter((a) => a.correct).length / answers.length) * 100,
      )
    : 0;
}
export function regenerateHearts(
  hearts: number,
  updatedAt: Date,
  now: Date,
  cap: number,
) {
  const ticks = Math.max(
    0,
    Math.floor((now.getTime() - updatedAt.getTime()) / RULES.heartIntervalMs),
  );
  return {
    hearts: Math.min(cap, hearts + ticks),
    heartsUpdatedAt:
      hearts + ticks >= cap
        ? now
        : new Date(updatedAt.getTime() + ticks * RULES.heartIntervalMs),
  };
}
export function nextStreak(
  last: string | null,
  today: string,
  streak: number,
  guards: number,
) {
  if (last === today) return { streak, guards };
  const gap = last
    ? Math.round((Date.parse(today) - Date.parse(last)) / 86400000)
    : Infinity;
  if (gap === 1) return { streak: streak + 1, guards };
  if (gap === 2 && guards > 0)
    return { streak: streak + 1, guards: guards - 1 };
  return { streak: 1, guards };
}
