// @vitest-environment jsdom
import React from "react";
import { afterEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { LessonPlayer } from "@/features/learning/components/lesson-player";
afterEach(cleanup);
const lesson = {
  id: "l",
  title: "Einführung",
  blocks: [{ id: "b", text: "Lies den Text." }],
  questions: [
    {
      id: "q",
      prompt: "Welche Antwort?",
      options: [
        { id: "a", text: "Antwort A" },
        { id: "b", text: "Antwort B" },
      ],
    },
  ],
};
it("reads, answers and completes using server feedback", async () => {
  const answer = vi.fn(async () => ({
    correct: true,
    explanation: "Erklärung vom Server",
  }));
  const finish = vi.fn(async () => ({ score: 100, xp: 25 }));
  render(
    <LessonPlayer
      lesson={lesson}
      onStart={async () => "attempt"}
      onAnswer={answer}
      onFinish={finish}
      onBookmark={async () => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Antwort prüfen" }),
    ).toBeDefined(),
  );
  expect(
    (
      screen.getByRole("button", {
        name: "Antwort prüfen",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Antwort A" }));
  fireEvent.click(screen.getByRole("button", { name: "Antwort prüfen" }));
  await waitFor(() =>
    expect(screen.getByText("Erklärung vom Server")).toBeDefined(),
  );
  expect(answer).toHaveBeenCalledWith("attempt", "q", "a");
  fireEvent.click(screen.getByRole("button", { name: "Lektion abschließen" }));
  await waitFor(() => expect(screen.getByText("Gut gemacht!")).toBeDefined());
  expect(finish).toHaveBeenCalledWith("attempt");
});
it("shows service failures without granting progress", async () => {
  render(
    <LessonPlayer
      lesson={lesson}
      onStart={async () => {
        throw new Error("Keine Herzen verfügbar.");
      }}
      onAnswer={vi.fn()}
      onFinish={vi.fn()}
      onBookmark={async () => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toBe(
      "Keine Herzen verfügbar.",
    ),
  );
  expect(screen.getByText("Lies den Text.")).toBeDefined();
});
