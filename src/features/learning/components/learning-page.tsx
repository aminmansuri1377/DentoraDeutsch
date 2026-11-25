"use client";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import type { LearningCatalog } from "@/server/services/catalog";
import { LearningDashboard } from "./learning-dashboard";
import { Loading, ErrorNotice } from "@/components/ui/feedback";
export function LearningPage({
  initialCatalog,
  name,
}: {
  initialCatalog?: LearningCatalog;
  name?: string;
}) {
  const trpc = useTRPC();
  const courses = useQuery({
    ...trpc.learning.catalog.queryOptions(),
    initialData: initialCatalog,
    staleTime: 120_000,
  });
  if (courses.isPending) return <Loading />;
  if (courses.error) return <ErrorNotice message={courses.error.message} />;
  return (
    <LearningDashboard
      name={name}
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
