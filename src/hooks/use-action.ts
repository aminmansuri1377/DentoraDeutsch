"use client";
import { useState } from "react";
export function useAction() {
  const [message, setMessage] = useState(""),
    [pending, setPending] = useState(false);
  async function run(action: () => Promise<unknown>, success = "Gespeichert.") {
    setPending(true);
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Ein Fehler ist aufgetreten.",
      );
    } finally {
      setPending(false);
    }
  }
  return { message, pending, run };
}
