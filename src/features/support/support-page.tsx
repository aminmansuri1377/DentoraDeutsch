"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { useAction } from "@/hooks/use-action";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
export function SupportPage() {
  const api = useTRPC(),
    cache = useQueryClient(),
    action = useAction();
  const tickets = useQuery(api.support.tickets.queryOptions()),
    create = useMutation(api.support.create.mutationOptions());
  const [subject, setSubject] = useState(""),
    [body, setBody] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="WIR SIND FÜR DICH DA"
        title="Wie können wir helfen?"
        description="Antworten finden oder eine Nachricht an den Support schreiben."
      />
      <div className="two-grid">
        <Card>
          <h2>Häufige Fragen</h2>
          {[
            [
              "Wie melde ich mich an?",
              "Du erhältst einen einmaligen Link per E-Mail. Ein Passwort ist nicht erforderlich.",
            ],
            [
              "Wie sammle ich XP?",
              "Beantworte die Fragen einer Lektion und schließe sie erfolgreich ab. Für bereits abgeschlossene Lektionen gibt es keine weiteren XP.",
            ],
            [
              "Wann erhalte ich ein Zertifikat?",
              "Sobald du alle veröffentlichten Lektionen eines Kurses erfolgreich abgeschlossen hast.",
            ],
            [
              "Wie regenerieren sich Herzen?",
              "Ein Herz regeneriert sich alle vier Stunden bis zu deinem Kontolimit.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </Card>
        <Card>
          <h2>Neue Supportanfrage</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.run(async () => {
                await create.mutateAsync({ subject, body });
                setSubject("");
                setBody("");
                await cache.invalidateQueries();
              });
            }}
          >
            <label htmlFor="subject">Betreff</label>
            <input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              minLength={3}
              maxLength={120}
              required
            />
            <label htmlFor="support-body">Deine Nachricht</label>
            <textarea
              id="support-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              minLength={10}
              maxLength={5000}
              required
            />
            <Button disabled={action.pending}>Anfrage senden</Button>
            <p role="status">{action.message}</p>
          </form>
        </Card>
      </div>
      <h2>Deine Anfragen</h2>
      {tickets.data?.map((t) => (
        <Card key={t.id}>
          <span className="pill">
            {t.status === "OPEN" ? "Offen" : "Geschlossen"}
          </span>
          <h3>{t.subject}</h3>
          {t.messages.map((m) => (
            <p key={m.id}>{m.body}</p>
          ))}
        </Card>
      ))}
    </>
  );
}
