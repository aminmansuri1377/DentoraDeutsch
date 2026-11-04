"use client";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { Avatar } from "@/components/ui/avatar";
import { Loading, ErrorNotice } from "@/components/ui/feedback";
import { profileHref } from "@/features/community/profile-link";
import styles from "./profile.module.css";
export function Connections({
  userId,
  kind,
  onClose,
}: {
  userId: string;
  kind: "followers" | "following";
  onClose: () => void;
}) {
  const api = useTRPC(),
    data = useInfiniteQuery(
      api.profile.connections.infiniteQueryOptions(
        { userId, kind },
        { getNextPageParam: (page) => page.nextCursor },
      ),
    );
  return (
    <section className={styles.connections}>
      <header>
        <h2>{kind === "followers" ? "Follower" : "Folgt"}</h2>
        <button onClick={onClose}>Schließen</button>
      </header>
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorNotice message={data.error.message} />
      ) : (
        <>
          {!data.data.pages[0].items.length && <p>Noch keine Einträge.</p>}
          {data.data.pages
            .flatMap((page) => page.items)
            .map((user) => (
              <Link key={user.id} href={profileHref(user)}>
                <Avatar image={user.image} name={user.name} size={38} />
                <span>
                  {user.name || "Dentora Mitglied"}
                  {user.username && <small>@{user.username}</small>}
                </span>
              </Link>
            ))}
          {data.hasNextPage && (
            <button
              disabled={data.isFetchingNextPage}
              onClick={() => data.fetchNextPage()}
            >
              Weitere anzeigen
            </button>
          )}
        </>
      )}
    </section>
  );
}
