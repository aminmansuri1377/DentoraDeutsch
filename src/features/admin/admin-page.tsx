"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { useAction } from "@/hooks/use-action";
import { courseImportSchema } from "./content-schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { ErrorNotice, Loading } from "@/components/ui/feedback";
export function AdminPage() {
  const api = useTRPC(),
    cache = useQueryClient(),
    action = useAction();
  const [source, setSource] = useState(""),
    [reviewer, setReviewer] = useState("");
  const overview = useQuery(api.admin.overview.queryOptions()),
    lessons = useQuery(api.admin.lessons.queryOptions()),
    specialties = useQuery(api.admin.specialties.queryOptions());
  const importer = useMutation(api.admin.importCourse.mutationOptions()),
    publish = useMutation(api.admin.publish.mutationOptions()),
    publishCourse = useMutation(api.admin.publishCourse.mutationOptions());
  if (overview.isPending) return <Loading />;
  if (overview.error) return <ErrorNotice message={overview.error.message} />;
  return (
    <>
      <PageHeading
        eyebrow="REDAKTION"
        title="Inhalte mit Verantwortung veröffentlichen."
        description="Importieren, fachlich prüfen und anschließend freigeben."
      />
      <div className="three-grid">
        <Card>
          <h2>{overview.data.users}</h2>
          <p>Mitglieder</p>
        </Card>
        <Card>
          <h2>{overview.data.lessons}</h2>
          <p>Lektionen</p>
        </Card>
        <Card>
          <h2>{overview.data.reports}</h2>
          <p>Offene Meldungen</p>
        </Card>
      </div>
      <Card>
        <h2>Kurs importieren</h2>
        <p>
          JSON gemäß courseImportSchema. Neue Kurse bleiben bis zur Freigabe
          unveröffentlicht.
        </p>
        <details>
          <summary>Fachgebiets-IDs</summary>
          {specialties.data?.map((s) => (
            <p key={s.id}>
              {s.title}: <code>{s.id}</code>
            </p>
          ))}
        </details>
        <label htmlFor="import">Kursdaten (JSON)</label>
        <textarea
          id="import"
          rows={10}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          maxLength={500000}
        />
        <Button
          disabled={action.pending}
          onClick={() =>
            action.run(async () => {
              await importer.mutateAsync(
                courseImportSchema.parse(JSON.parse(source)),
              );
              setSource("");
              await cache.invalidateQueries();
            })
          }
        >
          Als Entwurf importieren
        </Button>
      </Card>
      <Card>
        <label htmlFor="reviewer">Name der fachlich prüfenden Person</label>
        <input
          id="reviewer"
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          minLength={3}
        />
        {lessons.data?.map((l) => (
          <div className="section-top" key={l.id}>
            <div>
              <h3>{l.title}</h3>
              <p>
                {l.chapter.course.title} · {l.status}
              </p>
            </div>
            <Button
              disabled={
                reviewer.length < 3 ||
                action.pending ||
                l.status === "PUBLISHED"
              }
              onClick={() =>
                action.run(async () => {
                  await publish.mutateAsync({
                    id: l.id,
                    reviewerName: reviewer,
                  });
                  await cache.invalidateQueries();
                })
              }
            >
              Lektion freigeben
            </Button>
            <Button
              variant="secondary"
              disabled={action.pending}
              onClick={() =>
                action.run(async () => {
                  await publishCourse.mutateAsync({ id: l.chapter.courseId });
                  await cache.invalidateQueries();
                })
              }
            >
              Kurs veröffentlichen
            </Button>
          </div>
        ))}
      </Card>
      {action.message && (
        <p className="notice" role="status">
          {action.message}
        </p>
      )}
    </>
  );
}
