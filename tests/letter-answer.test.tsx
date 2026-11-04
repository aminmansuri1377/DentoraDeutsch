// @vitest-environment jsdom
import React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { LetterAnswer } from "@/features/learning/components/letter-answer";
afterEach(cleanup);
it("handles duplicate letters by index and allows removing and resetting choices", () => {
  const change = vi.fn();
  render(
    <LetterAnswer
      letters={["L", "L", "E"]}
      disabled={false}
      onChange={change}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Buchstabe L, 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Buchstabe L, 2" }));
  expect(change).toHaveBeenLastCalledWith("LL");
  fireEvent.click(
    screen.getByRole("button", { name: "L entfernen, Stelle 1" }),
  );
  expect(change).toHaveBeenLastCalledWith("L");
  fireEvent.click(screen.getByRole("button", { name: "Zurücksetzen" }));
  expect(change).toHaveBeenLastCalledWith("");
});
