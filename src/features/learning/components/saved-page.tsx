"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";
import { Empty, Loading, ErrorNotice } from "@/components/ui/feedback";
export function SavedPage() {
  const api = useTRPC();
  const [tab, setTab] = useState("lessons");
  const questions = useQuery(api.learning.questionBookmarks.queryOptions());
  const saved = useQuery(api.learning.saved.queryOptions()),
    reviews = useQuery(api.learning.review.queryOptions()),
    highlights = useQuery(api.learning.highlights.queryOptions());
  const rows =
    tab === "questions"
      ? questions.data?.map((q) => ({
          id: q.id,
          title: q.question.prompt,
          lessonId: q.question.lessonId,
        }))
      : tab === "lessons"
        ? saved.data?.map((s) => ({
            id: s.id,
            title: s.lesson.title,
            lessonId: s.lesson.id,
          }))
        : tab === "review"
          ? reviews.data?.map((r) => ({
              id: r.id,
              title: r.question.prompt,
              lessonId: r.question.lessonId,
            }))
          : highlights.data?.map((h) => ({
              id: h.id,
              title: h.quote,
              lessonId: h.block.lessonId,
            }));
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
      {saved.isPending ? (
        <Loading />
      ) : saved.error ? (
        <ErrorNotice message={saved.error.message} />
      ) : rows?.length ? (
        rows.map((row) => (
          <Card key={row.id}>
            <Link className="text-link" href={`/lektion/${row.lessonId}`}>
              {row.title} →
            </Link>
          </Card>
        ))
      ) : (
        <Empty
          title="Platz für deine Aha-Momente"
          description="Speichere Lektionen, die du später wiederholen möchtest."
        />
      )}
    </>
  );
}
