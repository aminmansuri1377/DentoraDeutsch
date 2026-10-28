"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { useTRPC } from "@/trpc/provider";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { Loading, ErrorNotice, Empty } from "@/components/ui/feedback";
export function LeaderboardPage() {
  const api = useTRPC();
  const [period, setPeriod] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const data = useQuery(api.game.leaderboard.queryOptions({ period }));
  return (
    <>
      <PageHeading
        eyebrow="ZUSAMMEN WACHSEN"
        title="Jeder Lernmoment zählt."
        description="Sammle Erfahrungspunkte und feiere deinen Fortschritt."
      />
      <Card className="league-banner">
        <Trophy size={58} />
        <div>
          <h2>
            {period === "WEEKLY" ? "Deine Wochenliga" : "Deine Monatsliga"}
          </h2>
          <p>
            Die ersten drei Plätze erhalten{" "}
            {period === "WEEKLY" ? "100, 60 und 30" : "1.000, 700 und 500"}{" "}
            Diamanten.
          </p>
        </div>
      </Card>
      <div className="tabs">
        <button
          className={period === "WEEKLY" ? "selected" : ""}
          onClick={() => setPeriod("WEEKLY")}
        >
          Diese Woche
        </button>
        <button
          className={period === "MONTHLY" ? "selected" : ""}
          onClick={() => setPeriod("MONTHLY")}
        >
          Dieser Monat
        </button>
      </div>
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorNotice message={data.error.message} />
      ) : !data.data.entries.length ? (
        <Empty
          title="Die nächste Runde beginnt mit dir"
          description="Schließe eine Lektion ab und sammle deine ersten XP."
        />
      ) : (
        <Card>
          <div className="ranking-head">
            <span>PLATZ</span>
            <span>MITGLIED</span>
            <span>ERFAHRUNG</span>
          </div>
          {data.data.entries.map((e, i) => (
            <div className="ranking-row" key={e.id}>
              <strong>{i + 1}</strong>
              <span>
                <span className="avatar">
                  {e.user.name?.slice(0, 2) ?? "D"}
                </span>
                {e.user.name}
              </span>
              <strong>{e.xp} XP</strong>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
