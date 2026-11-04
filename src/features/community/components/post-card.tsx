"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers";
import { Heart, Bookmark, MessageCircle, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useTRPC } from "@/trpc/provider";
import { Comments } from "../comments";
import { FollowButton } from "./follow-button";
import { profileHref } from "../profile-link";
import { useSocialRefresh } from "../use-social-refresh";
import styles from "../community.module.css";
export type FeedPost =
  inferRouterOutputs<AppRouter>["social"]["feed"]["items"][number];
export function PostCard({
  post,
  viewerId,
}: {
  post: FeedPost;
  viewerId: string;
}) {
  const [expanded, setExpanded] = useState(false),
    [comments, setComments] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false);
  const api = useTRPC(),
    refresh = useSocialRefresh();
  const options = {
    onSuccess: async () => {
      await refresh();
    },
  };
  const like = useMutation(api.social.like.mutationOptions(options)),
    save = useMutation(api.social.save.mutationOptions(options)),
    remove = useMutation(api.social.remove.mutationOptions(options));
  const liked = !!post.likes.length,
    saved = !!post.bookmarks.length,
    error = like.error || save.error || remove.error;
  return (
    <article className={styles.post}>
      <header className={styles.author}>
        <Link className={styles.authorIdentity} href={profileHref(post.author)}>
          <Avatar image={post.author.image} name={post.author.name} />
          <span>
            <strong>{post.author.name || "Dentora Mitglied"}</strong>
            <small>{post.author.university || "Dentora Community"}</small>
            <time dateTime={post.createdAt.toISOString()}>
              {post.createdAt.toLocaleDateString("de-DE", {
                day: "numeric",
                month: "short",
              })}
            </time>
          </span>
        </Link>
        <FollowButton
          userId={post.authorId}
          following={!!post.author.follow_following.length}
          isSelf={viewerId === post.authorId}
        />
      </header>
      {post.body && (
        <div className={styles.body}>
          <p>
            {expanded || post.body.length <= 350
              ? post.body
              : post.body.slice(0, 350) + " …"}
          </p>
          {post.body.length > 350 && (
            <button
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              {expanded ? "Weniger anzeigen" : "Mehr anzeigen"}
            </button>
          )}
        </div>
      )}
      {post.media_post.map((media) => (
        <img
          key={media.id}
          className={styles.postImage}
          src={`/api/media/${media.id}`}
          alt="Bild zum Beitrag"
          loading="lazy"
        />
      ))}
      <div className={styles.actions}>
        <button
          aria-label={
            saved ? "Beitrag nicht mehr speichern" : "Beitrag speichern"
          }
          aria-pressed={saved}
          disabled={save.isPending}
          onClick={() => save.mutate({ postId: post.id, saved: !saved })}
        >
          <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
        </button>
        <div>
          <button
            aria-label={`${post._count.comments} Kommentare anzeigen`}
            aria-expanded={comments}
            onClick={() => setComments(!comments)}
          >
            <MessageCircle size={20} />
            {post._count.comments}
          </button>
          <button
            aria-label={liked ? "Gefällt mir zurücknehmen" : "Gefällt mir"}
            aria-pressed={liked}
            disabled={like.isPending}
            onClick={() => like.mutate({ postId: post.id, liked: !liked })}
          >
            <Heart size={20} fill={liked ? "currentColor" : "none"} />
            {post._count.likes}
          </button>
        </div>
        {viewerId === post.authorId && (
          <button
            aria-label="Beitrag löschen"
            onClick={() => setConfirmDelete(!confirmDelete)}
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>
      {confirmDelete && (
        <div className={styles.deleteConfirm}>
          <p>Diesen Beitrag entfernen?</p>
          <button
            disabled={remove.isPending}
            onClick={() => remove.mutate({ id: post.id })}
          >
            Entfernen
          </button>
          <button onClick={() => setConfirmDelete(false)}>Abbrechen</button>
        </div>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error.message}
        </p>
      )}
      {comments && <Comments postId={post.id} viewerId={viewerId} />}
    </article>
  );
}
