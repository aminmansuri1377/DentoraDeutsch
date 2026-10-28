"use client";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { LearningDashboard } from "./learning-dashboard";
import { Loading, ErrorNotice } from "@/components/ui/feedback";
export function LearningPage() {
  const trpc = useTRPC();
  const courses = useQuery(trpc.learning.catalog.queryOptions());
  const me = useQuery(trpc.profile.me.queryOptions());
  if (courses.isPending) return <Loading />;
  if (courses.error) return <ErrorNotice message={courses.error.message} />;
  return (
    <LearningDashboard
      name={me.data?.user.name?.split(" ")[0]}
      courses={courses.data.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        access: c.access,
        chapters: c.chapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          lessons: ch.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            minutes: l.estimatedMinutes,
            done: l.progress.length > 0,
          })),
        })),
      }))}
    />
  );
}
