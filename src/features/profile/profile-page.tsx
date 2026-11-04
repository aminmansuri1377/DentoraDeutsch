"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { Loading, ErrorNotice } from "@/components/ui/feedback";
import { ProfileHeader } from "./profile-header";
import { Connections } from "./connections";
import { BadgeGallery } from "./badge-gallery";
import { LogoutButton } from "./logout-button";
import { PostFeed } from "@/features/community/components/post-feed";
import styles from "./profile.module.css";
export function ProfilePage() {
  const api = useTRPC(),
    [connections, setConnections] = useState<"followers" | "following">(),
    [tab, setTab] = useState<"badges" | "posts">("badges");
  const me = useQuery(api.profile.me.queryOptions()),
    badges = useQuery(api.profile.badges.queryOptions()),
    certificates = useQuery(api.profile.certificates.queryOptions());
  if (me.isPending) return <Loading />;
  if (me.error) return <ErrorNotice message={me.error.message} />;
  const { user, game } = me.data;
  return (
    <div className={styles.profile}>
      <ProfileHeader
        user={user}
        xp={game.xp}
        streak={game.streak}
        own
        onConnections={setConnections}
        onPosts={() => setTab("posts")}
      />
      {connections && (
        <Connections
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
          Meine Beiträge
        </button>
      </div>
      {tab === "posts" ? (
        <PostFeed filter="mine" />
      ) : badges.isPending ? (
        <Loading />
      ) : badges.error ? (
        <ErrorNotice message={badges.error.message} />
      ) : (
        <BadgeGallery badges={badges.data.filter((b) => b.awards.length)} />
      )}
      <div className={styles.menu}>
        {[
          ["/community?filter=saved", "Gespeicherte Beiträge"],
          ["/gespeichert", "Gespeicherte Lektionen"],
          ["/shop", "Shop & Pro"],
          ["/einstellungen", "Einstellungen"],
          ["/hilfe", "Hilfe & Support"],
        ].map(([href, title]) => (
          <Link href={href} key={href}>
            {title}
            <span>›</span>
          </Link>
        ))}
      </div>
      <section className={styles.certificates}>
        <h2>Deine Zertifikate</h2>
        {certificates.error ? (
          <ErrorNotice message={certificates.error.message} />
        ) : certificates.data?.length ? (
          certificates.data.map((c) => (
            <Link key={c.id} href={`/zertifikat/${c.code}`}>
              {c.courseSnapshot} →
            </Link>
          ))
        ) : (
          <p>Schließe einen Kurs ab, um dein Zertifikat zu erhalten.</p>
        )}
      </section>
      <LogoutButton />
    </div>
  );
}
