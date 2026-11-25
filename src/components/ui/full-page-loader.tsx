import { WalkingLoader } from "./walking-loader";
import styles from "./full-page-loader.module.css";

export function FullPageLoader({ label = "Dein Lernraum wird vorbereitet …" }: { label?: string }) {
  return (
    <div className={styles.screen} role="status" aria-live="polite" aria-label={label}>
      <WalkingLoader />
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
}
