"use client";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { useSocialRefresh } from "../use-social-refresh";
import styles from "../community.module.css";
export function FollowButton({
  userId,
  following,
  isSelf = false,
}: {
  userId: string;
  following: boolean;
  isSelf?: boolean;
}) {
  const api = useTRPC(),
    refresh = useSocialRefresh();
  const mutation = useMutation(
    api.social.follow.mutationOptions({
      onSuccess: async () => {
        await refresh();
      },
    }),
  );
  if (isSelf) return null;
  return (
    <div className={styles.follow}>
      <button
        disabled={mutation.isPending}
        aria-pressed={following}
        onClick={() => mutation.mutate({ userId, follow: !following })}
      >
        {mutation.isPending ? "…" : following ? "Entfolgen" : "+ Folgen"}
      </button>
      {mutation.error && <small role="alert">{mutation.error.message}</small>}
    </div>
  );
}
