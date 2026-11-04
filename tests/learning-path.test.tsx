// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  LearningDashboard,
  type CourseView,
} from "../src/features/learning/components/learning-dashboard";
import { pathState } from "../src/features/learning/path-state";
vi.mock("next/image", () => ({
  default: ({ priority, ...props }: any) => <img {...props} />,
}));
const course: CourseView = {
  id: "endo",
  title: "Endodontologie",
  description: "",
  access: "FREE",
  chapters: [
    {
      id: "one",
      title: "Pulpa",
      lessons: [
        { id: "a", title: "Erste Lektion", minutes: 5, done: false },
        { id: "b", title: "Zweite Lektion", minutes: 5, done: false },
      ],
    },
    {
      id: "two",
      title: "Dentin",
      lessons: [{ id: "c", title: "Dritte Lektion", minutes: 5, done: false }],
    },
  ],
};
afterEach(() => {
  cleanup();
  sessionStorage.clear();
});
it("shows one current step and disables later lessons across chapter boundaries", () => {
  render(<LearningDashboard courses={[course]} />);
  expect(
    screen
      .getByRole("link", { name: "Erste Lektion – Starten" })
      .getAttribute("aria-current"),
  ).toBe("step");
  expect(
    (
      screen.getByRole("button", {
        name: "Zweite Lektion – Gesperrt",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(
    (
      screen.getByRole("button", {
        name: "Dritte Lektion – Gesperrt",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(screen.getAllByText("Hier geht’s weiter!")).toHaveLength(1);
});
it("moves the mascot after completion and allows replay", () => {
  const { rerender } = render(<LearningDashboard courses={[course]} />);
  const updated = structuredClone(course);
  updated.chapters[0].lessons[0].done = true;
  rerender(<LearningDashboard courses={[updated]} />);
  expect(
    screen
      .getByRole("link", { name: "Zweite Lektion – Starten" })
      .getAttribute("aria-current"),
  ).toBe("step");
  expect(
    screen.getByRole("link", { name: "Erste Lektion – Wiederholen" }),
  ).toBeTruthy();
  expect(screen.getAllByText("Hier geht’s weiter!")).toHaveLength(1);
});
it("wraps category arrows and remembers the selected course without mixing progress", () => {
  const second = {
    ...course,
    id: "child",
    title: "Kinderzahnheilkunde",
    chapters: [],
  };
  render(<LearningDashboard courses={[course, second]} />);
  fireEvent.click(
    screen.getByRole("button", {
      name: "Nächstes Fachgebiet: Kinderzahnheilkunde",
    }),
  );
  expect(
    screen.getByRole("heading", { name: "Kinderzahnheilkunde" }),
  ).toBeTruthy();
  expect(sessionStorage.getItem("dentora.learning.course")).toBe("child");
  expect(screen.queryByText("Hier geht’s weiter!")).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Nächstes Fachgebiet: Endodontologie" }),
  );
  expect(
    screen.getByRole("link", { name: "Erste Lektion – Starten" }),
  ).toBeTruthy();
});
it("never offers an unfinished content draft as playable", () => {
  const draft = structuredClone(course);
  draft.chapters[0].lessons[0].available = false;
  expect(pathState(draft).currentId).toBeUndefined();
  render(<LearningDashboard courses={[draft]} />);
  expect(screen.queryByRole("link")).toBeNull();
  expect(
    (
      screen.getByRole("button", {
        name: "Erste Lektion – In Vorbereitung",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
