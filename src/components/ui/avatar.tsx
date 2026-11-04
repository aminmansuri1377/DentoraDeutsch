"use client";
import { useEffect, useState } from "react";
import styles from "./avatar.module.css";
export function Avatar({
  image,
  name,
  size = 44,
}: {
  image?: string | null;
  name?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image]);
  return (
    <span className={styles.avatar} style={{ width: size, height: size }}>
      {image && !failed ? (
        <img
          src={image}
          alt={name ? `Profilbild von ${name}` : "Profilbild"}
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-label="Kein Profilbild">
          {(name?.trim() || "D").slice(0, 2).toLocaleUpperCase("de")}
        </span>
      )}
    </span>
  );
}
