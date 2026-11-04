"use client";
import { useEffect, useState } from "react";
import { BookOpen, Layers, Route, ArrowRight } from "lucide-react";
import { LearningPath } from "./learning-path";
import { CategoryCarousel } from "./category-carousel";
import { pathState, type CourseView } from "../path-state";
import styles from "./learning-dashboard.module.css";
export type { CourseView } from "../path-state";
export function LearningDashboard({
  courses,
  name = "du",
  demo = false,
}: {
  courses: CourseView[];
  name?: string;
  demo?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string>();
  const [tab, setTab] = useState<"path" | "catalog">("path");
  const storageKey = demo ? "dentora.demo.course" : "dentora.learning.course";
  useEffect(() => {
    try {
      setSelectedId(sessionStorage.getItem(storageKey) ?? undefined);
    } catch {}
  }, [storageKey]);
  const selected = Math.max(
    0,
    courses.findIndex((c) => c.id === selectedId),
  );
  const course = courses[selected];
  const progress = course ? pathState(course) : undefined;
  function select(index: number) {
    const id = courses[index]?.id;
    if (!id) return;
    setSelectedId(id);
    try {
      sessionStorage.setItem(storageKey, id);
    } catch {}
    setTab("path");
  }
  return (
    <div className={styles.dashboard}>
      <header className={styles.heading}>
        <div>
          <span>DEIN WISSEN WÄCHST</span>
          <h1>Dein Lernpfad</h1>
        </div>
        <button
          aria-label="Alle Fachgebiete anzeigen"
          onClick={() => setTab("catalog")}
        >
          <Layers size={16} /> Fachgebiete
        </button>
      </header>
      <p className={styles.greeting}>
        {name !== "du"
          ? `Schön, dass du da bist, ${name}.`
          : "Schön, dass du da bist."}{" "}
        Ein Schritt nach dem anderen.
      </p>
      <div className={styles.tabs} role="tablist" aria-label="Lernbereiche">
        <button
          id="path-tab"
          role="tab"
          aria-selected={tab === "path"}
          aria-controls="learning-content"
          onClick={() => setTab("path")}
        >
          <Route size={16} /> Lernpfade
        </button>
        <button
          id="catalog-tab"
          role="tab"
          aria-selected={tab === "catalog"}
          aria-controls="learning-content"
          onClick={() => setTab("catalog")}
        >
          <BookOpen size={16} /> Kursübersicht
        </button>
      </div>
      <div
        id="learning-content"
        role="tabpanel"
        aria-labelledby={tab === "path" ? "path-tab" : "catalog-tab"}
      >
        {tab === "catalog" ? (
          <div className={styles.catalog}>
            {courses.map((c, i) => (
              <button key={c.id} onClick={() => select(i)}>
                <span className={styles.icon}>
                  <BookOpen size={21} />
                </span>
                <span>
                  <strong>{c.specialtyTitle ?? c.title}</strong>
                  <small>
                    {c.chapters.length} Abschnitte ·{" "}
                    {c.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)}{" "}
                    Lektionen
                  </small>
                </span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        ) : course && progress ? (
          <>
            <CategoryCarousel
              courses={courses}
              selected={selected}
              onSelect={select}
              completed={progress.completed}
              total={progress.total}
            />
            <LearningPath
              key={course.id}
              course={course}
              prefix={demo ? "/demo" : ""}
            />
          </>
        ) : (
          <p className={styles.empty}>
            Dein Lernpfad wird vorbereitet. Veröffentlichte Kurse erscheinen
            hier.
          </p>
        )}
      </div>
    </div>
  );
}
