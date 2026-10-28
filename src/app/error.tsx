"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="auth-screen">
      <div className="auth-card">
        <h1>Das hat nicht geklappt.</h1>
        <p>
          Bitte versuche es erneut. Falls der Fehler bleibt, kontaktiere den
          Support.
        </p>
        <button className="button primary" onClick={reset}>
          Erneut versuchen
        </button>
      </div>
    </main>
  );
}
