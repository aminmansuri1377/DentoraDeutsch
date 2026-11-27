"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Highlighter, Flag, Share2 } from "lucide-react";
import { useTRPC } from "@/trpc/provider";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
export function LessonTools({
  questionId,
  blockId,
  text,
}: {
  questionId?: string;
  blockId?: string;
  text?: string;
}) {
  const api = useTRPC(),
    cache = useQueryClient(),
    action = useAction();
  const [report, setReport] = useState(false),
    [reason, setReason] = useState("");
  const questionBookmarks = useQuery(api.learning.questionBookmarks.queryOptions());
  const highlights = useQuery(api.learning.highlights.queryOptions());
  const bookmarkedQuestion = !!questionId &&
    (questionBookmarks.data?.some((item) => item.questionId === questionId) ?? false);
  const blockHighlights = highlights.data?.filter((item) => item.blockId === blockId) ?? [];
  const save = useMutation(api.learning.saveQuestion.mutationOptions()),
    highlight = useMutation(api.learning.highlight.mutationOptions()),
    removeHighlight = useMutation(api.learning.removeHighlight.mutationOptions()),
    flag = useMutation(api.learning.reportQuestion.mutationOptions());
  return (
    <div className="lesson-tools">
      <div>
        {questionId && (
          <Button
            variant="ghost"
            disabled={action.pending || questionBookmarks.isPending}
            aria-pressed={bookmarkedQuestion}
            onClick={() =>
              action.run(async () => {
                await save.mutateAsync({ questionId, saved: !bookmarkedQuestion });
                await cache.invalidateQueries({ queryKey: api.learning.questionBookmarks.queryKey() });
              }, bookmarkedQuestion ? "Frage entfernt." : "Frage gespeichert.")
            }
          >
            <Bookmark size={16} fill={bookmarkedQuestion ? "currentColor" : "none"} />
            {bookmarkedQuestion ? "Frage entfernen" : "Frage merken"}
          </Button>
        )}
        {blockId && text && (
          <Button
            variant="ghost"
            disabled={action.pending || highlights.isPending}
            aria-pressed={blockHighlights.length > 0}
            onClick={() =>
              action.run(async () => {
                if (blockHighlights.length) {
                  await Promise.all(blockHighlights.map((item) =>
                    removeHighlight.mutateAsync({ id: item.id })
                  ));
                } else {
                  const selected = window.getSelection()?.toString().trim();
                  const quote = (
                    selected && text.includes(selected) ? selected : text
                  ).slice(0, 1000);
                  await highlight.mutateAsync({ blockId, quote, note: "" });
                }
                await cache.invalidateQueries({ queryKey: api.learning.highlights.queryKey() });
              }, blockHighlights.length ? "Markierung entfernt." : "Markierung gespeichert.")
            }
          >
            <Highlighter size={16} fill={blockHighlights.length ? "currentColor" : "none"} />
            {blockHighlights.length ? "Markierung entfernen" : "Markieren"}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() =>
            action.run(async () => {
              await navigator.clipboard.writeText(window.location.href);
            }, "Link kopiert.")
          }
        >
          <Share2 size={16} />
          Teilen
        </Button>
        {questionId && (
          <Button variant="ghost" onClick={() => setReport(true)}>
            <Flag size={16} />
            Melden
          </Button>
        )}
      </div>
      {action.message && (
        <p role="status" className="notice">
          {action.message}
        </p>
      )}
      {report && questionId && (
        <Dialog title="Frage melden" onClose={() => setReport(false)}>
          <form
            className="delete-body"
            onSubmit={(e) => {
              e.preventDefault();
              action.run(async () => {
                await flag.mutateAsync({ questionId, reason });
                setReport(false);
              }, "Vielen Dank für deinen Hinweis.");
            }}
          >
            <label htmlFor="report-reason">Was ist dir aufgefallen?</label>
            <textarea
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={5}
              maxLength={1000}
              required
            />
            <p role="status">{action.message}</p>
            <Button disabled={action.pending}>Hinweis senden</Button>
          </form>
        </Dialog>
      )}
    </div>
  );
}
