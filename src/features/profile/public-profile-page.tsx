"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { Loading, ErrorNotice, Empty } from "@/components/ui/feedback";
import { ProfileHeader } from "./profile-header";
import { Connections } from "./connections";
import { BadgeGallery } from "./badge-gallery";
import { PostFeed } from "@/features/community/components/post-feed";
import styles from "./profile.module.css";
export function PublicProfilePage({ username }: { username: string }) {
  const api = useTRPC(),
    [connections, setConnections] = useState<"followers" | "following">(),
    [tab, setTab] = useState<"badges" | "posts">("badges");
  const data = useQuery(api.profile.public.queryOptions({ username }));
  if (data.isPending) return <Loading />;
  if (data.error) return <ErrorNotice message={data.error.message} />;
  if (!data.data)
    return (
      <Empty
        title="Profil nicht verfügbar"
        description="Dieses Profil ist privat oder existiert nicht."
      />
    );
  const user = data.data;
  return (
    <div className={styles.profile}>
      <ProfileHeader
        user={user}
        xp={user.game?.xp ?? 0}
        streak={user.game?.streak ?? 0}
        own={user.isSelf}
        following={user.following}
        onConnections={setConnections}
        onPosts={() => setTab("posts")}
      />
      {connections && (
        <Connections
          key={`${user.id}-${connections}`}
          userId={user.id}
          kind={connections}
          onClose={() => setConnections(undefined)}
        />
      )}
      <div className={styles.switcher}>
        <button
          aria-pressed={tab === "badges"}
          onClick={() => setTab("badges")}
        >
          Abzeichen
        </button>
        <button aria-pressed={tab === "posts"} onClick={() => setTab("posts")}>
          Beiträge
        </button>
      </div>
      {tab === "posts" ? (
        <PostFeed authorId={user.id} />
      ) : (
        <BadgeGallery badges={user.userBadge_user.map((a) => a.badge)} />
      )}
    </div>
  );
}
