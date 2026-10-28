"use client";
import { useActionState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
export function LoginForm({ testMode }: { testMode: boolean }) {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  return (
    <form action={action}>
      <label htmlFor="email">E-Mail-Adresse</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="du@beispiel.de"
        required
        maxLength={254}
      />
      {state.error && (
        <p role="alert" className="notice error">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending
          ? "Einen Moment …"
          : testMode
            ? "Jetzt loslegen →"
            : "Anmeldelink senden →"}
      </Button>
      <small>
        {testMode
          ? "Testmodus: Du bist direkt angemeldet – ohne Bestätigungscode."
          : "Dein Anmeldelink ist 15 Minuten gültig."}
      </small>
    </form>
  );
}
