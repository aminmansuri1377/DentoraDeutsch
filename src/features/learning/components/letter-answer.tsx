"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
export function LetterAnswer({
  letters,
  disabled,
  savedText,
  onChange,
}: {
  letters: string[];
  disabled: boolean;
  savedText?: string | null;
  onChange: (value: string) => void;
}) {
  const [chosen, setChosen] = useState<number[]>([]);
  function update(next: number[]) {
    setChosen(next);
    onChange(next.map((i) => letters[i]).join(""));
  }
  return (
    <div className="letter-question">
      <p className="muted">
        Tippe die Buchstaben in der richtigen Reihenfolge an.
      </p>
      <div
        className="letter-slots"
        aria-label="Deine Antwort"
        aria-live="polite"
      >
        {savedText ? (
          <strong>{savedText}</strong>
        ) : chosen.length ? (
          chosen.map((index, position) => (
            <button
              type="button"
              disabled={disabled}
              key={index}
              aria-label={`${letters[index]} entfernen, Stelle ${position + 1}`}
              onClick={() => update(chosen.filter((_, i) => i !== position))}
            >
              {letters[index]}
            </button>
          ))
        ) : (
          <span>Dein Wort …</span>
        )}
      </div>
      <div className="letter-bank">
        {letters.map((letter, index) => (
          <button
            type="button"
            key={index}
            disabled={disabled || chosen.includes(index)}
            aria-label={`Buchstabe ${letter}, ${index + 1}`}
            onClick={() => update([...chosen, index])}
          >
            {letter}
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        disabled={disabled || !chosen.length}
        onClick={() => update([])}
      >
        Zurücksetzen
      </Button>
    </div>
  );
}
