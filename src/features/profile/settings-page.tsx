"use client";
import { logoutAction } from "@/features/auth/actions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { useAction } from "@/hooks/use-action";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { Loading, ErrorNotice } from "@/components/ui/feedback";
export function SettingsPage() {
  const api = useTRPC(),
    cache = useQueryClient(),
    action = useAction();
  const me = useQuery(api.profile.me.queryOptions()),
    mutation = useMutation(api.profile.update.mutationOptions());
  if (me.isPending) return <Loading />;
  if (me.error) return <ErrorNotice message={me.error.message} />;
  const user = me.data.user;
  return (
    <>
      <PageHeading
        eyebrow="DEIN LERNRAUM"
        title="So, wie es zu dir passt."
        description="Passe dein Profil und deine Lerngewohnheiten an."
      />
      <Card className="narrow">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            action.run(async () => {
              await mutation.mutateAsync({
                name: String(f.get("name")),
                username: String(f.get("username")),
                bio: String(f.get("bio")),
                university: String(f.get("university")),
                goalMinutes: Number(f.get("goalMinutes")) as 15 | 30 | 60 | 90,
                publicProfile: f.has("publicProfile"),
                emailReminders: f.has("emailReminders"),
              });
              await cache.invalidateQueries();
            });
          }}
        >
          <label htmlFor="name">Dein Name</label>
          <input
            id="name"
            name="name"
            defaultValue={user.name ?? ""}
            required
            maxLength={60}
          />
          <label htmlFor="username">Benutzername</label>
          <input
            id="username"
            name="username"
            defaultValue={user.username ?? ""}
            pattern="[a-z0-9_]{3,24}"
            required
          />
          <label htmlFor="bio">Über dich</label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={user.bio}
            maxLength={300}
          />
          <label htmlFor="university">Universität</label>
          <input
            id="university"
            name="university"
            defaultValue={user.university}
            maxLength={100}
          />
          <label htmlFor="goalMinutes">Dein tägliches Lernziel</label>
          <select
            id="goalMinutes"
            name="goalMinutes"
            defaultValue={user.goalMinutes}
          >
            {[15, 30, 60, 90].map((m) => (
              <option key={m} value={m}>
                {m} Minuten
              </option>
            ))}
          </select>
          <label className="check-label">
            <input
              name="publicProfile"
              type="checkbox"
              defaultChecked={user.publicProfile}
            />
            Mein Profil öffentlich anzeigen
          </label>
          <label className="check-label">
            <input
              name="emailReminders"
              type="checkbox"
              defaultChecked={user.emailReminders}
            />
            Lernerinnerungen per E-Mail erlauben
          </label>
          <Button disabled={action.pending}>Änderungen speichern</Button>
          <p role="status">{action.message}</p>
        </form>
      </Card>
      <Button variant="secondary" onClick={() => logoutAction()}>
        Sicher abmelden
      </Button>
    </>
  );
}
