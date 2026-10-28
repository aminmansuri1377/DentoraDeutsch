"use client";
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { LearningDashboard } from "@/features/learning/components/learning-dashboard";
import { LessonPlayer } from "@/features/learning/components/lesson-player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { Empty } from "@/components/ui/feedback";
import { demoCourses } from "./data";
export function DemoPage({ path }: { path: string[] }) {
  const [demoScore, setDemoScore] = useState(0);
  const [liked, setLiked] = useState(false),
    [goal, setGoal] = useState(15),
    [period, setPeriod] = useState("Woche"),
    [message, setMessage] = useState("");
  const page = path[0] ?? "lernen";
  let content: React.ReactNode;
  if (page === "lernen")
    content = <LearningDashboard courses={demoCourses} name="Lea" demo />;
  else if (page === "lektion")
    content = (
      <LessonPlayer
        demo
        lesson={{
          id: "demo",
          title: "Pulpa: das lebendige Zentrum",
          blocks: [
            {
              id: "b",
              text: "Willkommen in deiner Beispiellektion. Lies einen kurzen Lernabschnitt, prüfe dein Wissen und sieh dir die Erklärung zu deiner Antwort an. Diese Vorschau demonstriert den Lernablauf; medizinische Inhalte werden vor Veröffentlichung fachlich geprüft.",
            },
          ],
          questions: [
            {
              id: "q",
              prompt: "Wie festigst du neu gelerntes Wissen?",
              hint: "Aktives Erinnern hilft dir beim Lernen.",
              options: [
                {
                  id: "a",
                  text: "Durch regelmäßiges Wiederholen und Selbsttests.",
                },
                {
                  id: "b",
                  text: "Indem ich den Lerninhalt nie wieder ansehe.",
                },
              ],
            },
          ],
        }}
        onStart={async () => "demo-attempt"}
        onAnswer={async (_a, _q, option) => {
          setDemoScore(option === "a" ? 100 : 0);
          return {
            correct: option === "a",
            explanation:
              "Rufe Gelerntes aktiv ab und wiederhole es in zeitlichen Abständen.",
          };
        }}
        onFinish={async () => ({
          score: demoScore,
          xp: demoScore >= 60 ? 25 : 0,
        })}
        onBookmark={async () => {}}
      />
    );
  else if (page === "liga")
    content = (
      <>
        <PageHeading
          eyebrow="GEMEINSAM WACHSEN"
          title="Deine Lernmomente zählen."
          description="Ein kleiner Wettbewerb. Ein großer Ansporn."
        />
        <div className="league-banner card">
          <span style={{ fontSize: 58 }}>♜</span>
          <div>
            <h2>Deine {period} · Beispielrangliste</h2>
            <p>Bleib neugierig und sammle mit jeder Lektion neue XP.</p>
          </div>
        </div>
        <div className="tabs">
          {["Woche", "Monatsrunde"].map((p) => (
            <button
              key={p}
              className={period === p ? "selected" : ""}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <Card>
          {[
            "Sophie Weber",
            "Jonas Fischer",
            "Lea Müller",
            "Emma Schneider",
            "Paul Hoffmann",
          ].map((name, i) => (
            <div className="ranking-row" key={name}>
              <strong>{i + 1}</strong>
              <span>
                <span className="avatar">
                  {name
                    .split(" ")
                    .map((v) => v[0])
                    .join("")}
                </span>
                {name}
                {i === 2 ? " · Du" : ""}
              </span>
              <strong>{[845, 790, 725, 640, 580][i]} XP</strong>
            </div>
          ))}
        </Card>
      </>
    );
  else if (page === "community")
    content = (
      <>
        <PageHeading
          eyebrow="WISSEN VERBINDET"
          title="Deine Community"
          description="Gemeinsam fragen, lernen und weiterdenken."
        />
        <Card className="narrow">
          <div className="post-author">
            <span className="avatar">SW</span>
            <div>
              <strong>Sophie Weber</strong>
              <small>Beispielbeitrag · vor 2 Stunden</small>
            </div>
          </div>
          <h2>Kleine Lerneinheiten, großer Unterschied.</h2>
          <p>
            Ich reserviere mir jeden Morgen 15 Minuten zum Lernen. Wie baut ihr
            Wiederholungen in euren Alltag ein?
          </p>
          <Button variant="ghost" onClick={() => setLiked(!liked)}>
            {liked ? "♥ 25" : "♡ 24"} Gefällt mir
          </Button>
        </Card>
        <Card className="narrow">
          <h3>Teile deinen nächsten Aha-Moment</h3>
          <p>
            Mit einem Konto kannst du Beiträge schreiben, kommentieren und
            anderen folgen.
          </p>
          <Link className="button primary" href="/anmelden">
            Zur E-Mail-Anmeldung
          </Link>
        </Card>
      </>
    );
  else if (page === "ziele")
    content = (
      <>
        <PageHeading
          eyebrow="DEIN TEMPO. DEIN WEG."
          title="Jeden Tag ein Stück weiter."
          description="Finde eine Routine, die zu deinem Alltag passt."
        />
        <div className="three-grid">
          <Card>
            <span className="eyebrow">DEINE SERIE</span>
            <h2>🔥 7 Tage</h2>
            <p>Eine Woche voller Neugier.</p>
          </Card>
          <Card>
            <span className="eyebrow">TAGESZIEL</span>
            <h2>{goal} Minuten</h2>
            <select
              aria-label="Tagesziel"
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
            >
              {[15, 30, 60, 90].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Card>
          <Card>
            <span className="eyebrow">DEIN FORTSCHRITT</span>
            <h2>725 XP</h2>
            <p>Jeder Schritt zählt.</p>
          </Card>
        </div>
        <Card>
          <h2>Dein täglicher Glücksmoment</h2>
          <p>Probiere das Rad aus — in dieser Demo ohne Kontogutschrift.</p>
          <Button onClick={() => setMessage("Demo-Gewinn: 10 Diamanten ✦")}>
            Glücksrad drehen ↻
          </Button>
          <p role="status">{message}</p>
        </Card>
      </>
    );
  else if (page === "shop")
    content = (
      <>
        <PageHeading
          eyebrow="RAUM FÜR MEHR WISSEN"
          title="Dein nächster Schritt beginnt hier."
          description="Beispielangebote — in der Demo ist kein Kauf möglich."
        />
        <div className="three-grid">
          {[
            ["Ein Monat Pro", "19,90 €", "30 Tage"],
            ["Drei Monate Pro", "49,90 €", "90 Tage"],
            ["Ein Jahr Pro", "149,90 €", "365 Tage"],
          ].map(([title, price, duration]) => (
            <Card className="product-card" key={title}>
              <span className="pill">DENTORA PRO</span>
              <h2>{title}</h2>
              <p>Mehr Lernraum für deine fachliche Entwicklung.</p>
              <strong className="price">{price}</strong>
              <small>{duration} · Einmalzahlung</small>
              <Link className="button primary" href="/anmelden">
                Mehr erfahren →
              </Link>
            </Card>
          ))}
        </div>
      </>
    );
  else if (page === "profil")
    content = (
      <>
        <PageHeading
          eyebrow="DEINE LERNREISE"
          title="Lea Müller"
          description="Zahnmedizin lernen. Neugierig bleiben."
        />
        <div className="three-grid">
          {[
            ["725", "Erfahrungspunkte"],
            ["7", "Tage in Folge"],
            ["12", "Abgeschlossene Lektionen"],
          ].map(([v, l]) => (
            <Card key={l}>
              <span className="eyebrow">{l}</span>
              <h2>{v}</h2>
            </Card>
          ))}
        </div>
        <div className="profile-menu">
          {[
            ["gespeichert", "Gespeicherte Inhalte"],
            ["shop", "Shop & Pro"],
            ["einstellungen", "Einstellungen"],
            ["hilfe", "Hilfe & Support"],
          ].map(([href, title]) => (
            <Link key={href} href={`/demo/${href}`}>
              <strong>{title}</strong>
              <span>›</span>
            </Link>
          ))}
        </div>
        <h2>Deine Meilensteine</h2>
        <div className="three-grid">
          {["Der erste Schritt", "Eine Woche dabei", "Wissensdurst"].map(
            (t) => (
              <Card className="badge-card earned" key={t}>
                <span>✧</span>
                <h3>{t}</h3>
                <p>Beispielabzeichen</p>
              </Card>
            ),
          )}
        </div>
      </>
    );
  else if (page === "hilfe")
    content = (
      <>
        <PageHeading
          eyebrow="WIR SIND FÜR DICH DA"
          title="Wie können wir helfen?"
          description="Die wichtigsten Antworten zu deinem Lernraum."
        />
        <Card>
          {[
            [
              "Wie funktioniert die Anmeldung?",
              "Du erhältst einen einmaligen Anmeldelink per E-Mail.",
            ],
            [
              "Was sehe ich in dieser Demo?",
              "Die Gestaltung und interaktive Beispiele. Die echte Anwendung verwendet Datenbank, Anmeldung und serverseitige Prüfungen.",
            ],
            [
              "Sind alle Kurse bereits verfügbar?",
              "Nein. Die vollständigen Fachinhalte müssen bereitgestellt und geprüft werden.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </Card>
      </>
    );
  else
    content = (
      <>
        <PageHeading
          eyebrow="DEIN LERNRAUM"
          title={
            page === "gespeichert"
              ? "Deine persönliche Sammlung"
              : page === "einstellungen"
                ? "Dein Profil, deine Einstellungen"
                : "Neuigkeiten für dich"
          }
          description="Dein Wissen und deine Lernreise an einem Ort."
        />
        <Empty
          title="Mit deinem Konto geht es weiter"
          description="Melde dich per E-Mail an, um deine persönlichen Daten zu speichern."
        />
        <Link className="button primary" href="/anmelden">
          Anmelden →
        </Link>
      </>
    );
  return <AppShell demo>{content}</AppShell>;
}
