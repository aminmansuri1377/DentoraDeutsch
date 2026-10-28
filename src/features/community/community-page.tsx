"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Bookmark, Send } from "lucide-react";
import { useTRPC } from "@/trpc/provider";
import { useAction } from "@/hooks/use-action";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { Loading, ErrorNotice, Empty } from "@/components/ui/feedback";
import { Comments } from "./comments";
export function CommunityPage() {
  const api = useTRPC(),
    cache = useQueryClient(),
    action = useAction();
  const [body, setBody] = useState(""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState<"all" | "mine" | "saved">("all"),
    [open, setOpen] = useState<string>();
  const feed = useQuery(api.social.feed.queryOptions({ filter, search }));
  const create = useMutation(api.social.create.mutationOptions()),
    like = useMutation(api.social.like.mutationOptions()),
    save = useMutation(api.social.save.mutationOptions());
  async function refresh() {
    await cache.invalidateQueries({ queryKey: api.social.pathKey() });
  }
  return (
    <>
      <PageHeading
        eyebrow="WISSEN VERBINDET"
        title="Deine Community"
        description="Gedanken teilen. Fragen stellen. Gemeinsam weiterkommen."
      />
      <div className="narrow">
        <Card>
          <label htmlFor="post">Was hast du heute gelernt?</label>
          <textarea
            id="post"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={5000}
            placeholder="Teile einen Gedanken mit der Community …"
          />
          <div className="section-top">
            <small className="muted">
              {body.length}/5000 · Keine Patientendaten teilen
            </small>
            <Button
              disabled={!body.trim() || action.pending}
              onClick={() =>
                action.run(async () => {
                  await create.mutateAsync({ body });
                  setBody("");
                  await refresh();
                }, "Dein Beitrag wurde veröffentlicht.")
              }
            >
              <Send size={16} />
              Veröffentlichen
            </Button>
          </div>
        </Card>
        {action.message && (
          <p role="status" className="notice">
            {action.message}
          </p>
        )}
        <div className="section-top">
          <select
            aria-label="Beiträge filtern"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">Alle Beiträge</option>
            <option value="mine">Meine Beiträge</option>
            <option value="saved">Gespeichert</option>
          </select>
          <input
            aria-label="Beiträge suchen"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Community durchsuchen …"
          />
        </div>
        {feed.isPending ? (
          <Loading />
        ) : feed.error ? (
          <ErrorNotice message={feed.error.message} />
        ) : feed.data.items.length === 0 ? (
          <Empty
            title="Hier beginnt ein Gespräch"
            description="Teile den ersten Gedanken oder passe deine Suche an."
          />
        ) : (
          feed.data.items.map((post) => (
            <Card key={post.id} className="post">
              <div className="post-author">
                <span className="avatar">
                  {(post.author.name ?? "D").slice(0, 2)}
                </span>
                <div>
                  <strong>{post.author.name ?? "Dentora Mitglied"}</strong>
                  <small>{post.createdAt.toLocaleDateString("de-DE")}</small>
                </div>
              </div>
              <p className="post-body">{post.body}</p>
              <div className="post-actions">
                <Button
                  variant="ghost"
                  onClick={() =>
                    action.run(async () => {
                      await like.mutateAsync({
                        postId: post.id,
                        liked: !post.likes.length,
                      });
                      await refresh();
                    }, "")
                  }
                >
                  <Heart
                    size={18}
                    fill={post.likes.length ? "currentColor" : "none"}
                  />
                  {post._count.likes}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setOpen(open === post.id ? undefined : post.id)
                  }
                >
                  <MessageCircle size={18} />
                  {post._count.comments}
                </Button>
                <Button
                  variant="ghost"
                  aria-label="Beitrag speichern"
                  onClick={() =>
                    action.run(async () => {
                      await save.mutateAsync({
                        postId: post.id,
                        saved: !post.bookmarks.length,
                      });
                      await refresh();
                    }, "")
                  }
                >
                  <Bookmark
                    size={18}
                    fill={post.bookmarks.length ? "currentColor" : "none"}
                  />
                </Button>
              </div>
              {open === post.id && <Comments postId={post.id} />}
            </Card>
          ))
        )}
      </div>
    </>
  );
}
