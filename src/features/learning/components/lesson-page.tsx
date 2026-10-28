"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { Loading, ErrorNotice } from "@/components/ui/feedback";
import { LessonTools } from "./lesson-tools";
import { LessonPlayer } from "./lesson-player";
export function LessonPage({ id }: { id: string }) {
  const api = useTRPC(),
    cache = useQueryClient();
  const lesson = useQuery(api.learning.lesson.queryOptions({ id }));
  const start = useMutation(api.learning.start.mutationOptions()),
    answer = useMutation(api.learning.answer.mutationOptions()),
    finish = useMutation(api.learning.finish.mutationOptions()),
    bookmark = useMutation(api.learning.bookmark.mutationOptions());
  if (lesson.isPending) return <Loading />;
  if (lesson.error) return <ErrorNotice message={lesson.error.message} />;
  const l = lesson.data;
  return (
    <LessonPlayer
      key={id}
      renderTools={(context) => <LessonTools {...context} />}
      lesson={{
        id: l.id,
        title: l.title,
        blocks: l.blocks,
        questions: l.questions.map((q) => ({
          ...q,
          options: q.options,
        })),
      }}
      onStart={() => start.mutateAsync({ lessonId: id })}
      onAnswer={async (attemptId, questionId, optionId) => {
        const response = await answer.mutateAsync({
          attemptId,
          questionId,
          optionId,
        });
        void cache.invalidateQueries({ queryKey: api.profile.me.queryKey() });
        return response;
      }}
      onFinish={async (attemptId) => {
        const result = await finish.mutateAsync({ attemptId });
        void cache.invalidateQueries();
        return result;
      }}
      onBookmark={() => bookmark.mutateAsync({ lessonId: id, saved: true })}
    />
  );
}
