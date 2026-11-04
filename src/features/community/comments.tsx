"use client";
import { useState } from "react";
import { useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { Loading, ErrorNotice } from "@/components/ui/feedback";
import { CommentItem } from "./components/comment-item";
import { useSocialRefresh } from "./use-social-refresh";
import styles from "./community.module.css";
export function Comments({
  postId,
  viewerId,
}: {
  postId: string;
  viewerId: string;
}) {
  const api = useTRPC(),
    refresh = useSocialRefresh(),
    [body, setBody] = useState("");
  const comments = useInfiniteQuery(
    api.social.comments.infiniteQueryOptions(
      { postId },
      { getNextPageParam: (page) => page.nextCursor },
    ),
  );
  const create = useMutation(
    api.social.comment.mutationOptions({
      onSuccess: async () => {
        setBody("");
        await refresh();
      },
    }),
  );
  return (
    <section className={styles.comments} aria-label="Kommentare">
      <form
        className={styles.commentForm}
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim() && !create.isPending) create.mutate({ postId, body });
        }}
      >
        <label htmlFor={`comment-${postId}`}>Dein Kommentar</label>
        <textarea
          id={`comment-${postId}`}
          value={body}
          maxLength={5000}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
        />
        <div className={styles.commentFormActions}>
          <button
            type="submit"
            className="button primary compact"
            disabled={!body.trim() || create.isPending}
          >
            {create.isPending ? "Wird gesendet …" : "Kommentieren"}
          </button>
        </div>
        {create.error && <p role="alert">{create.error.message}</p>}
      </form>
      {comments.isPending ? (
        <Loading />
      ) : comments.error ? (
        <ErrorNotice message={comments.error.message} />
      ) : (
        comments.data.pages
          .flatMap((p) => p.items)
          .map((c) => (
            <CommentItem key={c.id} comment={c} viewerId={viewerId} />
          ))
      )}
      {comments.hasNextPage && (
        <button
          className="button secondary"
          disabled={comments.isFetchingNextPage}
          onClick={() => comments.fetchNextPage()}
        >
          Weitere Kommentare
        </button>
      )}
    </section>
  );
}
