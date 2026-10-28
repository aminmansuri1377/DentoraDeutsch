"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  LockKeyhole,
  Play,
  Sparkles,
  Trophy,
  Flame,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeading } from "@/components/ui/page-heading";
import { ToothArt } from "./tooth-art";
export type CourseView = {
  id: string;
  title: string;
  description: string;
  access: string;
  chapters: {
    id: string;
    title: string;
    lessons: { id: string; title: string; minutes: number; done: boolean }[];
  }[];
};
export function LearningDashboard({
  courses,
  name = "du",
  demo = false,
}: {
  courses: CourseView[];
  name?: string;
  demo?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState("path");
  const course = courses[selected];
  const lessons = course?.chapters.flatMap((c) => c.lessons) ?? [];
  const completed = lessons.filter((l) => l.done).length;
  const next = lessons.find((l) => !l.done);
  const prefix = demo ? "/demo" : "";
  return (
    <>
      <PageHeading
        eyebrow="KLEINE SCHRITTE. GROSSES WISSEN."
        title={`Schön, dass du da bist${name !== "du" ? `, ${name}` : ""}.`}
        description="Dein nächster Aha-Moment wartet schon auf dich."
      >
        <span className="date-chip">
          <Flame size={16} /> Dranbleiben lohnt sich
        </span>
      </PageHeading>
      <div className="dashboard-grid">
        <div className="main-column">
          <section className="hero">
            <div>
              <span className="hero-label">
                <span /> DEIN TÄGLICHER WISSENSVORSPRUNG
              </span>
              <h2>
                Heute lernen.
                <br />
                Morgen sicherer sein.
              </h2>
              <p>
                Eine Lektion. Neue Perspektiven.
                <br />
                Entwickle dein Wissen Schritt für Schritt.
              </p>
              {next ? (
                <Link
                  className="button light"
                  href={`${prefix}/lektion/${next.id}`}
                >
                  Weiterlernen <ArrowRight size={18} />
                </Link>
              ) : (
                <span className="button light">Alle Lektionen geschafft ✓</span>
              )}
            </div>
            <ToothArt />
          </section>
          <div className="section-top">
            <div className="tabs">
              <button
                className={tab === "path" ? "selected" : ""}
                onClick={() => setTab("path")}
              >
                Mein Lernpfad
              </button>
              <button
                className={tab === "catalog" ? "selected" : ""}
                onClick={() => setTab("catalog")}
              >
                Alle Fachgebiete
              </button>
            </div>
            <span className="muted small">{courses.length} Lernangebote</span>
          </div>
          {tab === "catalog" ? (
            <div className="course-grid">
              {courses.map((c, i) => (
                <button
                  key={c.id}
                  className="card course-card"
                  onClick={() => {
                    setSelected(i);
                    setTab("path");
                  }}
                >
                  <span className="course-icon">
                    <BookOpen />
                  </span>
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                  <span className="text-link">
                    Lernpfad ansehen <ArrowRight size={16} />
                  </span>
                </button>
              ))}
            </div>
          ) : course ? (
            <>
              <Card className="course-summary">
                <div className="course-icon">
                  <BookOpen size={25} />
                </div>
                <div className="grow">
                  <span className="eyebrow">DEIN AKTUELLES FACHGEBIET</span>
                  <h2>{course.title}</h2>
                  <div className="progress-row">
                    <Progress
                      label="Kursfortschritt"
                      value={
                        lessons.length ? (completed / lessons.length) * 100 : 0
                      }
                    />
                    <span>
                      {completed}/{lessons.length}
                    </span>
                  </div>
                </div>
                <select
                  aria-label="Fachgebiet auswählen"
                  value={selected}
                  onChange={(e) => setSelected(Number(e.target.value))}
                >
                  {courses.map((c, i) => (
                    <option key={c.id} value={i}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </Card>
              {course.chapters.map((chapter, ci) => (
                <section className="chapter" key={chapter.id}>
                  <div className="chapter-heading">
                    <span className="chapter-number">
                      {String(ci + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <span className="eyebrow">KAPITEL {ci + 1}</span>
                      <h3>{chapter.title}</h3>
                    </div>
                    <span className="muted small">
                      {chapter.lessons.length} Lektionen
                    </span>
                  </div>
                  <div className="lesson-list">
                    {chapter.lessons.map((lesson, index) => {
                      const locked =
                        index > 0 && !chapter.lessons[index - 1].done;
                      return (
                        <div
                          key={lesson.id}
                          className={`lesson-row ${lesson.done ? "done" : locked ? "locked" : "current"}`}
                        >
                          <span className="lesson-marker">
                            {lesson.done ? (
                              <Check size={20} />
                            ) : locked ? (
                              <LockKeyhole size={18} />
                            ) : (
                              <Play size={19} fill="currentColor" />
                            )}
                          </span>
                          <div className="grow">
                            <h4>{lesson.title}</h4>
                            <span className="small muted">
                              {lesson.minutes} Min. · Wissen & Quiz{" "}
                              {lesson.done ? "· Abgeschlossen" : ""}
                            </span>
                          </div>
                          {locked ? (
                            <LockKeyhole size={16} />
                          ) : (
                            <Link
                              className={
                                lesson.done
                                  ? "text-link"
                                  : "button primary compact"
                              }
                              href={`${prefix}/lektion/${lesson.id}`}
                            >
                              {lesson.done ? "Wiederholen" : "Starten"}
                              <ChevronRight size={16} />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </>
          ) : (
            <Card>
              <h3>Dein Lernpfad wird vorbereitet</h3>
              <p>Veröffentlichte Kurse erscheinen hier.</p>
            </Card>
          )}
        </div>
        <aside className="right-rail">
          <Card>
            <div className="card-title">
              <span className="mini-icon orange">
                <Flame size={20} />
              </span>
              <h3>Deine Lernwoche</h3>
            </div>
            <p>Mach Lernen zu deiner Gewohnheit.</p>
            <div className="week">
              {["M", "D", "M", "D", "F", "S", "S"].map((d, i) => (
                <div key={i}>
                  <span className={demo && i < 4 ? "complete" : ""}>
                    {demo && i < 4 ? <Check size={15} /> : i + 1}
                  </span>
                  <small>{d}</small>
                </div>
              ))}
            </div>
            <Link className="text-link" href={`${prefix}/ziele`}>
              Meine Ziele ansehen <ArrowRight size={15} />
            </Link>
          </Card>
          <Card>
            <div className="card-title">
              <span className="mini-icon gold">
                <Trophy size={20} />
              </span>
              <h3>Gemeinsam weiter</h3>
            </div>
            <p>Sammle XP und wachse mit der Community über dich hinaus.</p>
            <div className="league-art">
              ♜<span>DEINE WOCHENLIGA</span>
            </div>
            <Link className="button secondary full" href={`${prefix}/liga`}>
              Zur Rangliste <ArrowRight size={16} />
            </Link>
          </Card>
          <Card className="tip">
            <Sparkles size={20} />
            <span className="eyebrow">KLEINER LERNTIPP</span>
            <h3>Wiederholen wirkt.</h3>
            <p>
              Ein kurzer Rückblick festigt dein Wissen. Schau in deine
              gespeicherten Lektionen.
            </p>
            <Link className="text-link" href={`${prefix}/gespeichert`}>
              Wissen auffrischen →
            </Link>
          </Card>
        </aside>
      </div>
    </>
  );
}
