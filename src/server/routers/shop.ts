import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { stripeClient } from "../stripe";
export const shopRouter = router({
  products: protectedProcedure.query(({ ctx }) =>
    ctx.db.product.findMany({ orderBy: { priceCents: "asc" } }),
  ),
  orders: protectedProcedure.query(({ ctx }) =>
    ctx.db.order.findMany({
      where: { userId: ctx.userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
  ),
  checkout: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.findFirst({
        where: { id: input.productId, active: true },
      });
      if (!product?.stripePriceId || !process.env.AUTH_URL)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Dieses Angebot ist noch nicht buchbar.",
        });
      const stripe = stripeClient();
      const price = await stripe.prices.retrieve(product.stripePriceId);
      if (
        price.unit_amount !== product.priceCents ||
        price.currency !== product.currency ||
        price.recurring
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Preis-Konfiguration ungültig.",
        });
      const order = await ctx.db.order.create({
        data: {
          userId: ctx.userId,
          productId: product.id,
          amountCents: product.priceCents,
          currency: product.currency,
        },
      });
      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          line_items: [{ price: product.stripePriceId, quantity: 1 }],
          client_reference_id: order.id,
          metadata: { orderId: order.id },
          success_url: `${process.env.AUTH_URL}/shop?zahlung=erfolgreich`,
          cancel_url: `${process.env.AUTH_URL}/shop?zahlung=abgebrochen`,
        },
        { idempotencyKey: order.id },
      );
      await ctx.db.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });
      return { url: session.url };
    }),
});
