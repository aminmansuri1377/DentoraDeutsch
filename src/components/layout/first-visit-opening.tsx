"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./first-visit-opening.module.css";

const KEY = "dentora.opening.seen.v1";

/** Runs once per browser tab session, never blocks navigation after hydration. */
export function FirstVisitOpening() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, "1");
    } catch {
      // Storage may be disabled; the opening still works for this mount.
    }
    setVisible(true);
    let ready = document.readyState === "complete";
    let minimumElapsed = false;
    let closed = false;
    const dismiss = () => {
      if (!closed && ready && minimumElapsed) {
        closed = true;
        setVisible(false);
      }
    };
    const onLoad = () => { ready = true; dismiss(); };
    if (!ready) window.addEventListener("load", onLoad, { once: true });
    const minimum = window.setTimeout(() => { minimumElapsed = true; dismiss(); }, 700);
    // A failed resource must not leave the user stuck behind the opening.
    const maximum = window.setTimeout(() => { closed = true; setVisible(false); }, 8000);
    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(minimum);
      window.clearTimeout(maximum);
    };
  }, []);

  if (!visible) return null;
  return (
    <div className={styles.overlay} role="status" aria-label="Dentora wird geöffnet" aria-live="polite">
      <Image
        className={styles.art}
        src="/loaders/dentora-opening.webp"
        alt="Dentora"
        fill
        sizes="100vw"
        priority
        unoptimized
      />
    </div>
  );
}
