"use client";
import { useState } from "react";
import Link from "next/link";
import { Bookmark, Lightbulb, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ErrorNotice } from "@/components/ui/feedback";
export type LessonContent = {
  id: string;
  title: string;
  blocks: { id: string; text: string; sourceUrl?: string | null }[];
  questions: {
    id: string;
    prompt: string;
    hint?: string | null;
    options: { id: string; text: string }[];
  }[];
};
export function LessonPlayer({
  lesson,
  onStart,
  onAnswer,
  onFinish,
  onBookmark,
  demo = false,
  renderTools,
}: {
  lesson: LessonContent;
  onStart: () => Promise<string>;
  onAnswer: (
    attemptId: string,
    questionId: string,
    optionId: string,
  ) => Promise<{ correct: boolean; explanation: string }>;
  onFinish: (id: string) => Promise<{ score: number; xp: number }>;
  onBookmark: () => Promise<unknown>;
  demo?: boolean;
  renderTools?: (context: {
    questionId?: string;
    blockId?: string;
    text?: string;
  }) => React.ReactNode;
}) {
  const [step, setStep] = useState(0),
    [attempt, setAttempt] = useState<string>(),
    [selected, setSelected] = useState<string>(),
    [feedback, setFeedback] = useState<{
      correct: boolean;
      explanation: string;
    }>(),
    [result, setResult] = useState<{ score: number; xp: number }>(),
    [hint, setHint] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string>(),
    [saved, setSaved] = useState(false);
  const block = lesson.blocks[step],
    question = lesson.questions[step - lesson.blocks.length];
  const total = lesson.blocks.length + lesson.questions.length;
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }
  async function next() {
    await act(async () => {
      let id = attempt;
      if (!id) {
        id = await onStart();
        setAttempt(id);
      }
      if (step + 1 === total) {
        setResult(await onFinish(id));
        return;
      }
      setStep(step + 1);
      setSelected(undefined);
      setFeedback(undefined);
      setHint(false);
    });
  }
  if (result)
    return (
      <Card className="lesson-player result">
        <CheckCircle2 size={64} />
        <span className="eyebrow">DEIN NÄCHSTER SCHRITT IST GESCHAFFT</span>
        <h1>{result.score >= 60 ? "Gut gemacht!" : "Bleib neugierig!"}</h1>
        <p>
          {result.score}% richtig · +{result.xp} XP
        </p>
        <Link className="button primary" href={demo ? "/demo" : "/lernen"}>
          Zurück zum Lernpfad
        </Link>
      </Card>
    );
  return (
    <div className="lesson-player">
      <Link className="text-link" href={demo ? "/demo" : "/lernen"}>
        ← Zurück zum Lernpfad
      </Link>
      <div className="section-top">
        <h1>{lesson.title}</h1>
        <Button
          variant="ghost"
          aria-label="Lektion speichern"
          onClick={() =>
            act(async () => {
              await onBookmark();
              setSaved(true);
            })
          }
        >
          <Bookmark fill={saved ? "currentColor" : "none"} />
        </Button>
      </div>
      <Progress value={(step / total) * 100} label="Lektionsfortschritt" />
      <p className="muted small">
        Schritt {step + 1} von {total}
      </p>
      <Card>
        {block ? (
          <>
            <span className="eyebrow">WISSEN ENTDECKEN</span>
            <p className="lesson-text">{block.text}</p>
            {block.sourceUrl && (
              <a
                className="text-link"
                href={block.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Quelle ansehen ↗
              </a>
            )}
          </>
        ) : question ? (
          <>
            <span className="eyebrow">DEIN WISSENSCHECK</span>
            <h2>{question.prompt}</h2>
            <div className="answers">
              {question.options.map((o, i) => (
                <button
                  key={o.id}
                  disabled={!!feedback || busy}
                  className={`answer ${selected === o.id ? "chosen" : ""}`}
                  onClick={() => setSelected(o.id)}
                >
                  <span aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                  {o.text}
                </button>
              ))}
            </div>
            {question.hint && (
              <>
                <Button variant="ghost" onClick={() => setHint(!hint)}>
                  <Lightbulb size={17} />
                  Kleiner Hinweis
                </Button>
                {hint && <p className="notice">{question.hint}</p>}
              </>
            )}
            {feedback && (
              <div
                role="status"
                className={`notice ${feedback.correct ? "success" : ""}`}
              >
                <strong>
                  {feedback.correct ? "Richtig!" : "Noch nicht ganz."}
                </strong>
                <p>{feedback.explanation}</p>
              </div>
            )}
          </>
        ) : null}
      </Card>
      {renderTools?.({
        questionId: question?.id,
        blockId: block?.id,
        text: block?.text,
      })}
      {error && <ErrorNotice message={error} />}
      <div className="lesson-actions">
        {step > 0 && block && (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>
            Zurück
          </Button>
        )}
        {question && !feedback ? (
          <Button
            disabled={!selected || busy}
            onClick={() =>
              act(async () => {
                const id = attempt ?? (await onStart());
                setAttempt(id);
                setFeedback(await onAnswer(id, question.id, selected!));
              })
            }
          >
            Antwort prüfen
          </Button>
        ) : (
          <Button disabled={busy} onClick={next}>
            {step + 1 === total ? "Lektion abschließen" : "Weiter"}
            <ArrowRight size={17} />
          </Button>
        )}
      </div>
    </div>
  );
}
