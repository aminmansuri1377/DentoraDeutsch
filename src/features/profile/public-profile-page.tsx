"use client";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { useAction } from "@/hooks/use-action";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading, ErrorNotice, Empty } from "@/components/ui/feedback";
export function PublicProfilePage({ username }: { username: string }) {
  const api = useTRPC(),
    action = useAction();
  const [following, setFollowing] = useState(false);
  const data = useQuery(api.profile.public.queryOptions({ username })),
    follow = useMutation(api.social.follow.mutationOptions());
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
    <>
      <PageHeading
        eyebrow={`@${user.username}`}
        title={user.name ?? "Dentora Mitglied"}
        description={user.bio}
      >
        <Button
          disabled={action.pending}
          onClick={() =>
            action.run(async () => {
              await follow.mutateAsync({ userId: user.id, follow: !following });
              setFollowing(!following);
            })
          }
        >
          {following ? "Nicht mehr folgen" : "Folgen"}
        </Button>
      </PageHeading>
      <div className="three-grid">
        <Card>
          <h2>{user.game?.xp ?? 0}</h2>
          <p>Erfahrungspunkte</p>
        </Card>
        <Card>
          <h2>{user._count.follow_following}</h2>
          <p>Follower</p>
        </Card>
        <Card>
          <h2>{user._count.follow_follower}</h2>
          <p>Folgt</p>
        </Card>
      </div>
      <p role="status">{action.message}</p>
    </>
  );
}
