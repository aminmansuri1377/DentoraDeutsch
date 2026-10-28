import { z } from "zod";
import { randomInt } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { atomic } from "../transaction";
import { dayKey } from "@/features/gamification/rules";
export const gameRouter = router({
  leaderboard: protectedProcedure
    .input(z.object({ period: z.enum(["WEEKLY", "MONTHLY"]) }))
    .query(async ({ ctx, input }) => {
      const season = await ctx.db.leagueSeason.findFirst({
        where: {
          period: input.period,
          startsAt: { lte: new Date() },
          endsAt: { gt: new Date() },
        },
        orderBy: { startsAt: "desc" },
      });
      if (!season) return { season: null, entries: [] };
      const entries = await ctx.db.leagueEntry.findMany({
        where: { seasonId: season.id },
        orderBy: [{ xp: "desc" }, { userId: "asc" }],
        take: 100,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              publicProfile: true,
            },
          },
        },
      });
      return {
        season,
        entries: entries.map((e) => ({
          ...e,
          user: e.user.publicProfile
            ? e.user
            : {
                id: e.user.id,
                name: "Anonym",
                username: null,
                publicProfile: false,
              },
        })),
      };
    }),
  history: protectedProcedure.query(({ ctx }) =>
    ctx.db.leagueEntry.findMany({
      where: { userId: ctx.userId, season: { settledAt: { not: null } } },
      include: { season: true },
      orderBy: { season: { startsAt: "desc" } },
    }),
  ),
  spin: protectedProcedure.mutation(({ ctx }) =>
    atomic(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: ctx.userId },
      });
      const day = dayKey(new Date(), user.timezone);
      const previous = await tx.wheelSpin.findUnique({
        where: { userId_day: { userId: ctx.userId, day } },
      });
      if (previous) return previous;
      const gems = [0, 5, 5, 10, 15][randomInt(5)];
      const spin = await tx.wheelSpin.create({
        data: { userId: ctx.userId, day, gems, prize: `${gems} Diamanten` },
      });
      await tx.gameState.upsert({
        where: { userId: ctx.userId },
        create: { userId: ctx.userId, gems },
        update: { gems: { increment: gems } },
      });
      await tx.rewardLedger.create({
        data: {
          userId: ctx.userId,
          key: `wheel:${ctx.userId}:${day}`,
          gems,
          reason: "WHEEL",
        },
      });
      return spin;
    }),
  ),
  exchange: protectedProcedure
    .input(z.object({ item: z.enum(["HEART", "GUARD"]) }))
    .mutation(({ ctx, input }) =>
      atomic(async (tx) => {
        const state = await tx.gameState.findUniqueOrThrow({
          where: { userId: ctx.userId },
        });
        const cost = input.item === "HEART" ? 5 : 25;
        if (state.gems < cost)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nicht genug Diamanten.",
          });
        if (input.item === "GUARD" && state.streakGuards >= 2)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Du hast bereits zwei Schutzschilde.",
          });
        if (input.item === "HEART" && state.hearts >= 20)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Deine Herzen sind voll.",
          });
        await tx.rewardLedger.create({
          data: {
            userId: ctx.userId,
            key: crypto.randomUUID(),
            gems: -cost,
            reason: input.item,
          },
        });
        return tx.gameState.update({
          where: { userId: ctx.userId },
          data: {
            gems: { decrement: cost },
            ...(input.item === "HEART"
              ? { hearts: { increment: 1 } }
              : { streakGuards: { increment: 1 } }),
          },
        });
      }),
    ),
  claim: protectedProcedure.mutation(({ ctx }) =>
    atomic(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: ctx.userId },
      });
      const day = dayKey(new Date(), user.timezone);
      const key = { userId: ctx.userId, day, mission: "DAILY_LESSON" };
      if (
        await tx.missionClaim.findUnique({ where: { userId_day_mission: key } })
      )
        return { claimed: true };
      const activity = await tx.dailyActivity.findUnique({
        where: { userId_day: { userId: ctx.userId, day } },
      });
      if (!activity?.lessons)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Schließe heute eine Lektion ab.",
        });
      await tx.missionClaim.create({ data: key });
      await tx.rewardLedger.create({
        data: {
          userId: ctx.userId,
          key: `mission:${ctx.userId}:${day}`,
          gems: 5,
          reason: "MISSION",
        },
      });
      await tx.gameState.update({
        where: { userId: ctx.userId },
        data: { gems: { increment: 5 } },
      });
      return { claimed: true };
    }),
  ),
});
