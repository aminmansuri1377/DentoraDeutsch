export default function Page() {
  return (
    <main className="auth-screen">
      <article className="auth-card">
        <h1>Datenschutz</h1>
        <p>
          Diese Entwicklungsfassung ist noch kein öffentliches Angebot. Die
          betreibende Organisation muss vor Veröffentlichung ihre
          Datenschutzhinweise, Kontaktdaten, Aufbewahrungsfristen und Verträge
          mit Dienstleistern ergänzen.
        </p>
        <p>
          Die Anwendung verarbeitet E-Mail-Adresse, Profilangaben,
          Lernfortschritt, Beiträge und Kaufhistorie. Technisch notwendige
          Sitzungscookies werden für die Anmeldung verwendet.
        </p>
        <a href="/anmelden">Zur Anmeldung</a>
      </article>
    </main>
  );
}
