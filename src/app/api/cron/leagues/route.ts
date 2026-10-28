import { atomic } from "@/server/transaction";
import { db } from "@/server/db";
export async function GET(req: Request) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return new Response("Forbidden", { status: 403 });
  const now = new Date();
  for (const season of await db.leagueSeason.findMany({
    where: { endsAt: { lte: now }, settledAt: null },
  }))
    await atomic(async (tx) => {
      const current = await tx.leagueSeason.findUniqueOrThrow({
        where: { id: season.id },
      });
      if (current.settledAt) return;
      const entries = await tx.leagueEntry.findMany({
        where: { seasonId: season.id },
        orderBy: [{ xp: "desc" }, { userId: "asc" }],
      });
      for (const [i, entry] of entries.entries()) {
        const reward =
          (season.period === "WEEKLY" ? [100, 60, 30] : [1000, 700, 500])[i] ??
          0;
        await tx.leagueEntry.update({
          where: { id: entry.id },
          data: { rank: i + 1, rewardGems: reward },
        });
        if (reward) {
          await tx.rewardLedger.create({
            data: {
              userId: entry.userId,
              key: `league:${entry.id}`,
              gems: reward,
              reason: "LEAGUE",
            },
          });
          await tx.gameState.upsert({
            where: { userId: entry.userId },
            create: { userId: entry.userId, gems: reward },
            update: { gems: { increment: reward } },
          });
        }
      }
      await tx.leagueSeason.update({
        where: { id: season.id },
        data: { settledAt: now },
      });
    });
  for (const period of ["WEEKLY", "MONTHLY"]) {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    if (period === "WEEKLY")
      start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    else start.setUTCDate(1);
    const end = new Date(start);
    if (period === "WEEKLY") end.setUTCDate(end.getUTCDate() + 7);
    else end.setUTCMonth(end.getUTCMonth() + 1);
    await db.leagueSeason.upsert({
      where: { period_startsAt: { period, startsAt: start } },
      create: { period, startsAt: start, endsAt: end },
      update: {},
    });
  }
  await db.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
  return Response.json({ ok: true });
}
