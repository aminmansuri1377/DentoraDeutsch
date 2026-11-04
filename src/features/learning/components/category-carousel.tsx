import { ChevronLeft, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { CourseView } from "../path-state";
import styles from "./category-carousel.module.css";
export function CategoryCarousel({
  courses,
  selected,
  onSelect,
  completed,
  total,
}: {
  courses: CourseView[];
  selected: number;
  onSelect: (index: number) => void;
  completed: number;
  total: number;
}) {
  const course = courses[selected];
  if (!course) return null;
  const previous = (selected - 1 + courses.length) % courses.length;
  const next = (selected + 1) % courses.length;
  return (
    <section className={styles.carousel} aria-label="Fachgebiet wählen">
      <div className={styles.row}>
        <button
          disabled={courses.length < 2}
          onClick={() => onSelect(previous)}
          aria-label={`Vorheriges Fachgebiet: ${courses[previous].specialtyTitle ?? courses[previous].title}`}
        >
          <ChevronLeft size={21} />
        </button>
        <div className={styles.title} aria-live="polite" aria-atomic="true">
          <h2>{course.specialtyTitle ?? course.title}</h2>
          <p>
            {course.chapters.length} Abschnitte · {total} Lektionen
          </p>
          {course.access !== "FREE" && (
            <span className={styles.access}>
              {course.access === "PRO" ? "Pro" : "Kurszugang"}
            </span>
          )}
        </div>
        <button
          disabled={courses.length < 2}
          onClick={() => onSelect(next)}
          aria-label={`Nächstes Fachgebiet: ${courses[next].specialtyTitle ?? courses[next].title}`}
        >
          <ChevronRight size={21} />
        </button>
      </div>
      <Progress
        label="Fortschritt im Fachgebiet"
        value={total ? (completed / total) * 100 : 0}
      />
      <span className={styles.caption}>
        {completed} von {total} Lektionen abgeschlossen
      </span>
      <label className={styles.select}>
        Direkt auswählen
        <select
          value={selected}
          onChange={(e) => onSelect(Number(e.target.value))}
        >
          {courses.map((c, i) => (
            <option key={c.id} value={i}>
              {c.specialtyTitle ?? c.title}
              {c.specialtyTitle && c.title !== c.specialtyTitle
                ? ` – ${c.title}`
                : ""}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
