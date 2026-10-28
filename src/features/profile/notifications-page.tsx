"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/feedback";
export function NotificationsPage() {
  const api = useTRPC(),
    cache = useQueryClient();
  const data = useQuery(api.profile.notifications.queryOptions()),
    read = useMutation(
      api.profile.markRead.mutationOptions({
        onSuccess: () => cache.invalidateQueries(),
      }),
    );
  return (
    <>
      <PageHeading
        eyebrow="DEIN POSTFACH"
        title="Neuigkeiten für dich"
        description="Deine Lernreise auf einen Blick."
      />
      {data.data?.length ? (
        data.data.map((n) => (
          <Card key={n.id}>
            <h3>{n.title}</h3>
            <p>{n.body}</p>
            {!n.readAt && (
              <Button variant="ghost" onClick={() => read.mutate({ id: n.id })}>
                Als gelesen markieren
              </Button>
            )}
          </Card>
        ))
      ) : (
        <Empty
          title="Alles auf dem neuesten Stand"
          description="Neue Benachrichtigungen erscheinen hier."
        />
      )}
    </>
  );
}
