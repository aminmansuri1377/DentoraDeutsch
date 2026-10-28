export function databaseError(error: unknown): string {
  const value = error as { code?: string; message?: string };
  const code = value?.code;
  const descriptions: Record<string, string> = {
    P1017: "Verbindung während einer Abfrage geschlossen. Prüfe Postgres-/Pooler-Logs zum angegebenen Zeitpunkt.",
    P1001: "Datenbankserver nicht erreichbar.",
    P1011: "TLS-Verbindung fehlgeschlagen. Prüfe das CA-Zertifikat.",
    SELF_SIGNED_CERT_IN_CHAIN: "Zertifikatskette nicht vertrauenswürdig. Prüfe das CA-Zertifikat.",
    ERR_TLS_CERT_ALTNAME_INVALID: "Hostname und Zertifikat stimmen nicht überein.",
    P1000: "Datenbank-Anmeldung fehlgeschlagen.",
    "28P01": "Datenbank-Anmeldung fehlgeschlagen.",
    P2021: "Eine benötigte Tabelle fehlt. Prüfe den Migrationsstatus.",
    ECONNRESET: "Netzwerkverbindung zurückgesetzt.",
    ETIMEDOUT: "Zeitüberschreitung beim Datenbankzugriff.",
  };
  if (code && descriptions[code]) return `${code}: ${descriptions[code]}`;
  const message = value?.message ?? "";
  // Only show fixed configuration messages, never arbitrary driver errors or URLs.
  if (/^(DATABASE_URL |Das CA-Zertifikat )/.test(message)) return message;
  return `${code && /^[A-Z0-9_]+$/.test(code) ? code : "CONNECTION_ERROR"}: Verbindung fehlgeschlagen. Prüfe die Server-Logs.`;
}
