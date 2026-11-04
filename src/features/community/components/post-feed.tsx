"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { Loading, ErrorNotice, Empty } from "@/components/ui/feedback";
import { PostCard } from "./post-card";
export function PostFeed({
  filter = "all",
  search = "",
  authorId,
}: {
  filter?: "all" | "mine" | "saved";
  search?: string;
  authorId?: string;
}) {
  const api = useTRPC();
  const feed = useInfiniteQuery(
    api.social.feed.infiniteQueryOptions(
      { filter, search, authorId },
      { getNextPageParam: (page) => page.nextCursor },
    ),
  );
  if (feed.isPending) return <Loading />;
  if (feed.error) return <ErrorNotice message={feed.error.message} />;
  const posts = feed.data.pages.flatMap((p) => p.items);
  return (
    <>
      {posts.length ? (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            viewerId={feed.data.pages[0].viewerId}
          />
        ))
      ) : (
        <Empty
          title={
            filter === "saved"
              ? "Noch keine gespeicherten Beiträge"
              : filter === "mine"
                ? "Dein erster Beitrag wartet auf dich"
                : "Noch keine Beiträge"
          }
          description="Teile einen Gedanken oder passe deine Suche an."
        />
      )}
      {feed.hasNextPage && (
        <button
          className="button secondary full"
          disabled={feed.isFetchingNextPage}
          onClick={() => feed.fetchNextPage()}
        >
          {feed.isFetchingNextPage
            ? "Beiträge werden geladen …"
            : "Weitere Beiträge laden"}
        </button>
      )}
    </>
  );
}
