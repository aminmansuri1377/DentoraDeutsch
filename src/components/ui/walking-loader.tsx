import styles from "./walking-loader.module.css";

/** Isolated original Canvas choreography. The iframe has no access to the parent page. */
export function WalkingLoader() {
  return (
    <iframe
      className={styles.frame}
      title="Dentora-Hase lädt"
      src="/loaders/walking.html"
      sandbox="allow-scripts"
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}
