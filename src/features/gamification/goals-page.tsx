"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { useAction } from "@/hooks/use-action";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeading } from "@/components/ui/page-heading";
import { Loading, ErrorNotice } from "@/components/ui/feedback";
export function GoalsPage() {
  const api = useTRPC(),
    cache = useQueryClient(),
    action = useAction();
  const me = useQuery(api.profile.me.queryOptions());
  const claim = useMutation(api.game.claim.mutationOptions()),
    spin = useMutation(api.game.spin.mutationOptions());
  if (me.isPending) return <Loading />;
  if (me.error) return <ErrorNotice message={me.error.message} />;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
  }).format(new Date());
  const activity = me.data.activity.find((d) => d.day === today);
  return (
    <>
      <PageHeading
        eyebrow="DEIN TEMPO. DEIN FORTSCHRITT."
        title="Kleine Ziele, große Wirkung."
        description="Baue eine Lernroutine auf, die zu deinem Alltag passt."
      />
      <div className="three-grid">
        <Card>
          <span className="eyebrow">TÄGLICHES LERNZIEL</span>
          <h2>
            {Math.floor((activity?.seconds ?? 0) / 60)} /{" "}
            {me.data.user.goalMinutes} Min.
          </h2>
          <Progress
            label="Tagesziel"
            value={
              ((activity?.seconds ?? 0) / (me.data.user.goalMinutes * 60)) * 100
            }
          />
          <a className="text-link" href="/einstellungen">
            Lernziel anpassen →
          </a>
        </Card>
        <Card>
          <span className="eyebrow">DEINE SERIE</span>
          <h2>🔥 {me.data.game.streak} Tage</h2>
          <p>{me.data.game.streakGuards} Schutzschilde verfügbar</p>
        </Card>
        <Card>
          <span className="eyebrow">HEUTE GESAMMELT</span>
          <h2>✦ {activity?.xp ?? 0} XP</h2>
          <p>{activity?.lessons ?? 0} Lektionen abgeschlossen</p>
        </Card>
      </div>
      <div className="two-grid">
        <Card>
          <h2>Deine Tagesmission</h2>
          <p>Schließe eine neue Lektion erfolgreich ab.</p>
          <Button
            disabled={!activity?.lessons || action.pending}
            onClick={() =>
              action.run(async () => {
                await claim.mutateAsync();
                await cache.invalidateQueries();
              }, "5 Diamanten erhalten — oder bereits abgeholt.")
            }
          >
            5 Diamanten abholen
          </Button>
        </Card>
        <Card>
          <h2>Ein täglicher Glücksmoment</h2>
          <p>Eine kostenlose Drehung pro Tag. Gewinne bis zu 15 Diamanten.</p>
          <Button
            disabled={action.pending}
            onClick={() =>
              action.run(async () => {
                const result = await spin.mutateAsync();
                await cache.invalidateQueries();
                return result;
              }, "Dein Tagesgewinn wurde deinem Konto gutgeschrieben.")
            }
          >
            Glücksrad drehen ↻
          </Button>
        </Card>
      </div>
      {action.message && (
        <p className="notice" role="status">
          {action.message}
        </p>
      )}
      <Card>
        <h3>Deine letzten Lerntage</h3>
        <div className="activity-grid">
          {me.data.activity.map((a) => (
            <div
              key={a.id}
              title={`${a.day}: ${a.xp} XP`}
              className={a.lessons ? "active" : ""}
            >
              {a.day.slice(5)}
              <strong>{a.lessons} Lektionen</strong>
            </div>
          ))}
        </div>
        {!me.data.activity.length && (
          <p>Deine erste Lektion ist der Anfang deiner Lernreise.</p>
        )}
      </Card>
    </>
  );
}
