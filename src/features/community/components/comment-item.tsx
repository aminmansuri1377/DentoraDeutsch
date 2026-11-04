"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers";
import { Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useTRPC } from "@/trpc/provider";
import { profileHref } from "../profile-link";
import { useSocialRefresh } from "../use-social-refresh";
import styles from "../community.module.css";

type Comment =
  inferRouterOutputs<AppRouter>["social"]["comments"]["items"][number];
export function CommentItem({
  comment,
  viewerId,
}: {
  comment: Comment;
  viewerId: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const api = useTRPC(),
    refresh = useSocialRefresh();
  const remove = useMutation(
    api.social.removeComment.mutationOptions({
      onSuccess: async () => {
        setConfirm(false);
        await refresh();
      },
    }),
  );
  return (
    <article className={styles.comment}>
      <Link href={profileHref(comment.author)}>
        <Avatar
          image={comment.author.image}
          name={comment.author.name}
          size={32}
        />
      </Link>
      <div className={styles.commentContent}>
        <div className={styles.commentHeading}>
          <Link href={profileHref(comment.author)}>
            <strong>{comment.author.name || "Dentora Mitglied"}</strong>
          </Link>
          {viewerId === comment.authorId && (
            <button
              type="button"
              className={styles.commentDelete}
              aria-label="Kommentar löschen"
              aria-expanded={confirm}
              disabled={remove.isPending}
              onClick={() => setConfirm(!confirm)}
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>
        <p>{comment.body}</p>
        <time dateTime={comment.createdAt.toISOString()}>
          {comment.createdAt.toLocaleDateString("de-DE")}
        </time>
        {confirm && (
          <div className={styles.deleteConfirm}>
            <p>Deinen Kommentar löschen?</p>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate({ id: comment.id })}
            >
              {remove.isPending ? "Wird gelöscht …" : "Löschen"}
            </button>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => setConfirm(false)}
            >
              Abbrechen
            </button>
          </div>
        )}
        {remove.error && (
          <p className={styles.error} role="alert">
            {remove.error.message}
          </p>
        )}
      </div>
    </article>
  );
}
