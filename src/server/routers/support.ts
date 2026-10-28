import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
export const supportRouter = router({
  tickets: protectedProcedure.query(({ ctx }) =>
    ctx.db.ticket.findMany({
      where: { userId: ctx.userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
  ),
  create: protectedProcedure
    .input(
      z.object({
        subject: z.string().trim().min(3).max(120),
        body: z.string().trim().min(10).max(5000),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.ticket.create({
        data: {
          subject: input.subject,
          userId: ctx.userId,
          messages: {
            create: { body: input.body, authorId: ctx.userId },
          },
        },
      }),
    ),
  reply: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        body: z.string().trim().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.ticket.findFirstOrThrow({
        where: { id: input.ticketId, userId: ctx.userId },
      });
      return ctx.db.ticketMessage.create({
        data: { ...input, authorId: ctx.userId },
      });
    }),
  feedback: protectedProcedure
    .input(z.object({ body: z.string().min(5).max(3000) }))
    .mutation(({ ctx, input }) =>
      ctx.db.feedback.create({ data: { ...input, userId: ctx.userId } }),
    ),
});
