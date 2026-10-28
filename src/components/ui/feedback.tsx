import { Loader } from "./loader";
export function Loading({
  label = "Einen Moment …",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`loading-state ${compact ? "loading-compact" : "card"}`}
      role="status"
      aria-live="polite"
    >
      <Loader />
      <span>{label}</span>
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
