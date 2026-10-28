"use client";
import { useActionState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { panelLogin } from "./actions";
import { Button } from "@/components/ui/button";
export function PanelLogin({ testMode }: { testMode: boolean }) {
  const [state, action, pending] = useActionState(panelLogin, { error: "" });
  return (
    <main className="panel-login">
      <div className="panel-login-brand">
        <span>✦ dentora.</span>
        <small>ADMINISTRATION</small>
        <h1>
          Alles im Blick.
          <br />
          Alles an einem Ort.
        </h1>
        <p>
          Inhalte pflegen, Lernwege gestalten und deine Community begleiten.
        </p>
      </div>
      <section>
        <ShieldCheck size={36} />
        <h2>Willkommen im Adminbereich</h2>
        <p>
          {testMode
            ? "Gib das Panel-Passwort ein, um fortzufahren."
            : "Melde dich mit deinem bestätigten Administratorkonto an."}
        </p>
        {testMode ? (
          <form action={action}>
            <label htmlFor="panel-password">Passwort</label>
            <input
              id="panel-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              autoFocus
            />
            {state.error && (
              <p role="alert" className="notice error">
                {state.error}
              </p>
            )}
            <Button disabled={pending}>
              {pending ? "Anmeldung läuft …" : "Adminbereich öffnen →"}
            </Button>
            <small className="panel-test-label">
              Testumgebung · Gemeinsamer Panel-Zugang
            </small>
          </form>
        ) : (
          <Link className="button primary" href="/anmelden">
            Zur Anmeldung
          </Link>
        )}
        <Link className="text-link" href="/lernen">
          ← Zur Lernplattform
        </Link>
      </section>
    </main>
  );
}
