import Link from "next/link";
import Image from "next/image";
import { BookOpen, Check, LockKeyhole, Play } from "lucide-react";
import { pathState, type CourseView } from "../path-state";
import styles from "./learning-path.module.css";
export function LearningPath({
  course,
  prefix = "",
}: {
  course: CourseView;
  prefix?: string;
}) {
  const progress = pathState(course);
  return (
    <div className={styles.path}>
      {course.chapters.map((chapter, chapterIndex) => (
        <section key={chapter.id} aria-labelledby={`chapter-${chapter.id}`}>
          <header className={styles.chapter}>
            <div className={styles.chapterTop}>
              <span>ABSCHNITT {chapterIndex + 1}</span>
              <span>
                <BookOpen size={14} /> {chapter.lessons.length} Lektionen
              </span>
            </div>
            <h3 id={`chapter-${chapter.id}`}>{chapter.title}</h3>
            {chapter.guide && (
              <details>
                <summary>Kapitelübersicht</summary>
                <p>{chapter.guide}</p>
              </details>
            )}
          </header>
          <ol className={styles.steps}>
            {chapter.lessons.map((lesson, index) => {
              const state = progress.state(lesson);
              const label = `${lesson.title} – ${state === "done" ? "Wiederholen" : state === "current" ? "Starten" : lesson.available === false ? "In Vorbereitung" : "Gesperrt"}`;
              const content = (
                <>
                  <span className={styles.disc}>
                    {state === "done" ? (
                      <Check />
                    ) : state === "locked" ? (
                      <LockKeyhole size={22} />
                    ) : (
                      <Play size={22} fill="currentColor" />
                    )}
                  </span>
                  <span className={styles.pill}>Lektion {index + 1}</span>
                  <span className={styles.lessonTitle}>{lesson.title}</span>
                  <span className={styles.detail}>
                    {lesson.available === false
                      ? "In Vorbereitung"
                      : state === "locked"
                        ? "Vorherige Lektionen abschließen"
                        : state === "done"
                          ? "Abgeschlossen · Wiederholen"
                          : `${lesson.minutes} Min. · Los geht’s`}
                  </span>
                </>
              );
              return (
                <li
                  key={lesson.id}
                  className={`${styles.step} ${styles[state]}`}
                >
                  <span className={styles.connector} aria-hidden="true" />
                  {state === "current" && (
                    <div className={styles.companion} aria-hidden="true">
                      <span>Hier geht’s weiter!</span>
                      <Image
                        src="/mascots/purple-rabbit.png"
                        alt=""
                        width={84}
                        height={98}
                        priority
                      />
                    </div>
                  )}
                  {state === "locked" ? (
                    <button className={styles.node} disabled aria-label={label}>
                      {content}
                    </button>
                  ) : (
                    <Link
                      className={styles.node}
                      href={`${prefix}/lektion/${lesson.id}`}
                      aria-label={label}
                      aria-current={state === "current" ? "step" : undefined}
                    >
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
          {!chapter.lessons.length && (
            <p className={styles.empty}>
              Die Lektionen für diesen Abschnitt werden vorbereitet.
            </p>
          )}
        </section>
      ))}
      {!course.chapters.length && (
        <div className={styles.empty}>
          <BookOpen />
          <h3>Dieser Lernpfad entsteht gerade</h3>
          <p>Neue Lektionen erscheinen hier, sobald sie freigegeben sind.</p>
        </div>
      )}
      {progress.total > 0 && progress.completed === progress.total && (
        <div className={styles.finish}>
          <Check />
          <h3>Alles geschafft!</h3>
          <p>Du kannst jede Lektion wiederholen.</p>
        </div>
      )}
    </div>
  );
}
