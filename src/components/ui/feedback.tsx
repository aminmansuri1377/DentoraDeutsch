import { Loader } from "./loader";
import { WalkingLoader } from "./walking-loader";
export function Loading({
  label = "Einen Moment …",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={compact ? "loading-state loading-compact" : "loading-state"}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {compact ? <Loader /> : <WalkingLoader />}
      <span className="sr-only">{label}</span>
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
