"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
export function Comments({ postId }: { postId: string }) {
  const api = useTRPC(),
    cache = useQueryClient(),
    action = useAction();
  const [body, setBody] = useState("");
  const comments = useQuery(api.social.comments.queryOptions({ postId })),
    create = useMutation(api.social.comment.mutationOptions());
  return (
    <div className="comments">
      {comments.data?.map((c) => (
        <p key={c.id}>
          <strong>{c.author.name}</strong>
          <br />
          {c.body}
        </p>
      ))}
      <label htmlFor={`comment-${postId}`}>Dein Kommentar</label>
      <textarea
        id={`comment-${postId}`}
        value={body}
        maxLength={5000}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button
        disabled={!body.trim() || action.pending}
        onClick={() =>
          action.run(async () => {
            await create.mutateAsync({ postId, body });
            setBody("");
            await cache.invalidateQueries({ queryKey: api.social.pathKey() });
          })
        }
      >
        Kommentieren
      </Button>
      <p role="status">{action.message}</p>
    </div>
  );
}
