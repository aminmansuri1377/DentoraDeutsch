"use client";

/** A hard navigation re-executes failed server components and their DB reads. */
export default function ErrorPage() {
  return (
    <main className="auth-screen">
      <div className="auth-card">
        <h1>Das hat nicht geklappt.</h1>
        <p>
          Bitte versuche es erneut. Falls der Fehler bleibt, kontaktiere den
          Support.
        </p>
        <button
          type="button"
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Seite neu laden
        </button>
      </div>
    </main>
  );
}
