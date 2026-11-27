"use client";
import { useEffect, useState } from "react";
import styles from "./brand-wordmark.module.css";

const endings = ["ty", "versity", "verse"] as const;
export function BrandWordmark({ large = false }: { large?: boolean }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % endings.length), 1500);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span className={`${styles.wordmark} ${large ? styles.large : ""}`} aria-label="Zahn Uni – unity, university, universe">
      <span className={styles.name} aria-hidden="true">Zahn Uni</span>
      <span className={styles.suffix} aria-hidden="true" key={index}>{endings[index]}</span>
    </span>
  );
}
