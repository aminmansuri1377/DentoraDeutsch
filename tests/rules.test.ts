import { describe, it, expect } from "vitest";
import {
  dayKey,
  nextStreak,
  regenerateHearts,
  scoreAnswers,
} from "@/features/gamification/rules";
describe("learning rules", () => {
  it("handles Berlin midnight and DST", () => {
    expect(dayKey(new Date("2026-03-28T23:30:00Z"))).toBe("2026-03-29");
    expect(dayKey(new Date("2026-03-29T22:30:00Z"))).toBe("2026-03-30");
  });
  it("does not double count the same day", () =>
    expect(nextStreak("2026-10-28", "2026-10-28", 5, 2)).toEqual({
      streak: 5,
      guards: 2,
    }));
  it("consumes only one guard for one missed day", () =>
    expect(nextStreak("2026-10-26", "2026-10-28", 5, 2)).toEqual({
      streak: 6,
      guards: 1,
    }));
  it("resets long gaps even with guards", () =>
    expect(nextStreak("2026-10-20", "2026-10-28", 5, 2)).toEqual({
      streak: 1,
      guards: 2,
    }));
  it("caps regeneration and keeps fractional progress", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-01T05:00:00Z");
    expect(regenerateHearts(1, start, now, 5).hearts).toBe(2);
    expect(
      regenerateHearts(1, start, now, 5).heartsUpdatedAt.toISOString(),
    ).toBe("2026-01-01T04:00:00.000Z");
    expect(regenerateHearts(5, start, now, 5).hearts).toBe(5);
  });
  it("never awards a passing score for an empty quiz", () =>
    expect(scoreAnswers([])).toBe(0));
});
