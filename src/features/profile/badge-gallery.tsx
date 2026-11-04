"use client";
import { useState } from "react";
import { Award } from "lucide-react";
import styles from "./profile.module.css";
type Badge = {
  id: string;
  title: string;
  description: string;
  category: string;
};
const labels: Record<string, string> = {
  xp: "Punkte",
  streak: "Lernserie",
  social: "Community",
  lessons: "Lektionen",
  learning: "Lernen",
  specialty: "Fachgebiete",
  likes: "Likes",
};
export function BadgeGallery({ badges }: { badges: Badge[] }) {
  const [category, setCategory] = useState("all");
  const categories = [...new Set(badges.map((b) => b.category))];
  const visible =
    category === "all" ? badges : badges.filter((b) => b.category === category);
  return (
    <section>
      <div className={styles.badgeHeading}>
        <h2>Erreichte Abzeichen</h2>
        <span>{badges.length}</span>
      </div>
      <p className={styles.subtitle}>Meilensteine auf dem Lernweg.</p>
      <div className={styles.badgeTabs}>
        <button
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
        >
          Alle
        </button>
        {categories.map((c) => (
          <button
            key={c}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {labels[c.toLowerCase()] || c}
          </button>
        ))}
      </div>
      <div className={styles.badges}>
        {visible.length ? (
          visible.map((b) => (
            <article key={b.id}>
              <Award size={32} />
              <h3>{b.title}</h3>
              <p>{b.description}</p>
            </article>
          ))
        ) : (
          <p>
            Noch keine Abzeichen. Jede abgeschlossene Lektion bringt dich
            weiter.
          </p>
        )}
      </div>
    </section>
  );
}
