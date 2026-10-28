"use client";
import { useState } from "react";
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
  const save = useMutation(api.learning.saveQuestion.mutationOptions()),
    highlight = useMutation(api.learning.highlight.mutationOptions()),
    flag = useMutation(api.learning.reportQuestion.mutationOptions());
  return (
    <div className="lesson-tools">
      <div>
        {questionId && (
          <Button
            variant="ghost"
            disabled={action.pending}
            onClick={() =>
              action.run(async () => {
                await save.mutateAsync({ questionId, saved: true });
                await cache.invalidateQueries();
              }, "Frage gespeichert.")
            }
          >
            <Bookmark size={16} />
            Frage merken
          </Button>
        )}
        {blockId && text && (
          <Button
            variant="ghost"
            disabled={action.pending}
            onClick={() =>
              action.run(async () => {
                const selected = window.getSelection()?.toString();
                const quote = (
                  selected && text.includes(selected) ? selected : text
                ).slice(0, 1000);
                await highlight.mutateAsync({ blockId, quote, note: "" });
                await cache.invalidateQueries();
              }, "Markierung gespeichert.")
            }
          >
            <Highlighter size={16} />
            Markieren
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
