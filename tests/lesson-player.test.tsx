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
it("shows an incorrect answer as incorrect and can finish with zero XP", async () => {
  const answer = vi.fn(async () => ({
    correct: false,
    optionId: "b",
    explanation: "A ist richtig.",
  }));
  render(
    <LessonPlayer
      lesson={lesson}
      onStart={async () => "attempt"}
      onAnswer={answer}
      onFinish={async () => ({ score: 0, xp: 0 })}
      onBookmark={async () => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
  await screen.findByRole("button", { name: "Antwort prüfen" });
  fireEvent.click(screen.getByRole("button", { name: "Antwort B" }));
  fireEvent.click(screen.getByRole("button", { name: "Antwort prüfen" }));
  await screen.findByText("Noch nicht ganz.");
  expect(screen.queryByText("Richtig!")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Lektion abschließen" }));
  await screen.findByText("Bleib neugierig!");
  expect(screen.getByText("0% richtig · +0 XP")).toBeDefined();
});
it("restores the actual saved choice and feedback when resuming", async () => {
  const answer = vi.fn();
  render(
    <LessonPlayer
      lesson={lesson}
      onStart={async () => ({
        id: "resumed",
        answers: [
          {
            questionId: "q",
            optionId: "a",
            correct: true,
            explanation: "Gespeicherte Antwort",
          },
        ],
      })}
      onAnswer={answer}
      onFinish={async () => ({ score: 100, xp: 25 })}
      onBookmark={async () => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
  await screen.findByText("Gespeicherte Antwort");
  const a = screen.getByRole("button", {
    name: "Antwort A",
  }) as HTMLButtonElement;
  const b = screen.getByRole("button", {
    name: "Antwort B",
  }) as HTMLButtonElement;
  expect(a.getAttribute("aria-pressed")).toBe("true");
  expect(b.getAttribute("aria-pressed")).toBe("false");
  expect(b.disabled).toBe(true);
  expect(answer).not.toHaveBeenCalled();
});
it("keeps submitted answers after a finish failure and retries finish only", async () => {
  const answer = vi.fn(async () => ({
    correct: true,
    explanation: "Richtig gespeichert",
  }));
  const finish = vi
    .fn()
    .mockRejectedValueOnce(new Error("Datenbank vorübergehend nicht verfügbar"))
    .mockResolvedValueOnce({ score: 100, xp: 25 });
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
  await screen.findByRole("button", { name: "Antwort prüfen" });
  fireEvent.click(screen.getByRole("button", { name: "Antwort A" }));
  fireEvent.click(screen.getByRole("button", { name: "Antwort prüfen" }));
  await screen.findByText("Richtig gespeichert");
  fireEvent.click(screen.getByRole("button", { name: "Lektion abschließen" }));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Lektion abschließen" }));
  await screen.findByText("Gut gemacht!");
  expect(answer).toHaveBeenCalledTimes(1);
  expect(finish).toHaveBeenCalledTimes(2);
});
