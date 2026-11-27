"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useTRPC } from "@/trpc/provider";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";
import { Empty, Loading, ErrorNotice } from "@/components/ui/feedback";
export function SavedPage() {
  const api = useTRPC();
  const cache = useQueryClient();
  const [tab, setTab] = useState("lessons");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const unsaveLesson = useMutation(api.learning.bookmark.mutationOptions());
  const unsaveQuestion = useMutation(api.learning.saveQuestion.mutationOptions());
  const deleteHighlight = useMutation(api.learning.removeHighlight.mutationOptions());
  const questions = useQuery(api.learning.questionBookmarks.queryOptions());
  const saved = useQuery(api.learning.saved.queryOptions()),
    reviews = useQuery(api.learning.review.queryOptions()),
    highlights = useQuery(api.learning.highlights.queryOptions());
  const rows =
    tab === "questions"
      ? questions.data?.map((q) => ({
          id: q.id,
          entityId: q.questionId,
          title: q.question.prompt,
          lessonId: q.question.lessonId,
        }))
      : tab === "lessons"
        ? saved.data?.map((s) => ({
            id: s.id,
            entityId: s.lesson.id,
            title: s.lesson.title,
            lessonId: s.lesson.id,
          }))
        : tab === "review"
          ? reviews.data?.map((r) => ({
              id: r.id,
              entityId: r.questionId,
              title: r.question.prompt,
              lessonId: r.question.lessonId,
            }))
          : highlights.data?.map((h) => ({
              id: h.id,
              entityId: h.id,
              title: h.quote,
              lessonId: h.block.lessonId,
            }));
  const active = tab === "lessons" ? saved : tab === "questions" ? questions
    : tab === "highlights" ? highlights : reviews;
  async function remove(id: string) {
    if (removingId) return;
    setErrorMessage("");
    setRemovingId(id);
    try {
      if (tab === "lessons") {
        await unsaveLesson.mutateAsync({ lessonId: id, saved: false });
        await cache.invalidateQueries({ queryKey: api.learning.saved.queryKey() });
      } else if (tab === "questions") {
        await unsaveQuestion.mutateAsync({ questionId: id, saved: false });
        await cache.invalidateQueries({ queryKey: api.learning.questionBookmarks.queryKey() });
      } else if (tab === "highlights") {
        await deleteHighlight.mutateAsync({ id });
        await cache.invalidateQueries({ queryKey: api.learning.highlights.queryKey() });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Entfernen fehlgeschlagen.");
    } finally {
      setRemovingId(null);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="WISSEN FESTIGEN"
        title="Deine persönliche Sammlung"
        description="Bewahre Aha-Momente und frische dein Wissen auf."
      />
      <div className="tabs">
        {[
          ["lessons", "Lektionen"],
          ["questions", "Fragen"],
          ["highlights", "Markierungen"],
          ["review", "Wiederholen"],
        ].map(([key, label]) => (
          <button
            className={tab === key ? "selected" : ""}
            key={key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {errorMessage && <p className="notice error" role="alert">{errorMessage}</p>}
      {active.isPending ? (
        <Loading />
      ) : active.error ? (
        <ErrorNotice message={active.error.message} />
      ) : rows?.length ? (
        rows.map((row) => (
          <Card key={row.id}>
            <div className="collection-row">
              <Link className="text-link" href={`/lektion/${row.lessonId}`}>
                {row.title} →
              </Link>
              {tab !== "review" && (
                <button
                  type="button"
                  className="collection-remove"
                  aria-label="Aus Sammlung entfernen"
                  title="Entfernen"
                  disabled={removingId !== null}
                  onClick={() => void remove(row.entityId)}
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>
          </Card>
        ))
      ) : (
        <Empty
          title="Noch keine Einträge"
          description="Hier erscheinen deine gespeicherten Inhalte."
        />
      )}
    </>
  );
}
