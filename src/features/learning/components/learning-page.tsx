"use client";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { LearningDashboard } from "./learning-dashboard";
import { Loading } from "@/components/ui/feedback";
import styles from "./learning-page.module.css";

export function LearningPage() {
  const trpc = useTRPC();
  const courses = useQuery({
    ...trpc.learning.catalog.queryOptions(),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
    retry: 0,
  });
  // AppShell already subscribes to this key. React Query shares the request.
  const header = useQuery({
    ...trpc.profile.header.queryOptions(),
    staleTime: 120_000,
  });

  if (courses.isPending) {
    return <Loading label="Deine Lernpfade werden geladen …" />;
  }
  if (!courses.data) {
    return (
      <section className={styles.error} role="alert">
        <h2>Lernpfade konnten nicht geladen werden.</h2>
        <p>
          Bitte prüfe deine Verbindung und versuche es erneut. Deine Daten
          bleiben unverändert.
        </p>
        <button
          type="button"
          className="button primary"
          disabled={courses.isFetching}
          onClick={() => void courses.refetch()}
        >
          {courses.isFetching ? "Lädt …" : "Erneut versuchen"}
        </button>
      </section>
    );
  }
  return (
    <LearningDashboard
      name={header.data?.name?.split(" ")[0] ?? undefined}
      courses={courses.data.map((c) => ({
        id: c.id,
        title: c.title,
        specialtyId: c.specialty.id,
        specialtyTitle: c.slug.startsWith("dentigo-path-")
          ? c.title
          : c.specialty.title,
        description: c.description,
        access: c.access,
        chapters: c.chapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          guide: ch.guide,
          lessons: ch.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            minutes: l.estimatedMinutes,
            done: l.progress.length > 0,
            available: l.status === "PUBLISHED",
          })),
        })),
      }))}
    />
  );
}
