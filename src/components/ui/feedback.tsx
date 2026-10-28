export function Loading() {
  return (
    <div className="card" role="status">
      Dein Lernraum wird geladen …
    </div>
  );
}
export function ErrorNotice({ message }: { message?: string }) {
  return (
    <div className="notice error" role="alert">
      {message ?? "Ein Fehler ist aufgetreten. Bitte versuche es erneut."}
    </div>
  );
}
export function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty">
      <span>✧</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
