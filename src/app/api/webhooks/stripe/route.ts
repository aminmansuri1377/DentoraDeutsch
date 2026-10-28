import { stripeClient } from "@/server/stripe";
import { atomic } from "@/server/transaction";
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET)
    return new Response("Missing signature", { status: 400 });
  let event;
  try {
    event = stripeClient().webhooks.constructEvent(
      await req.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  )
    return Response.json({ received: true });
  const session = event.data.object;
  if (session.payment_status !== "paid")
    return Response.json({ received: true });
  await atomic(async (tx) => {
    if (await tx.webhookEvent.findUnique({ where: { id: event.id } })) return;
    const order = await tx.order.findUnique({
      where: { stripeSessionId: session.id },
      include: { product: true },
    });
    if (
      !order ||
      session.amount_total !== order.amountCents ||
      session.currency !== order.currency
    )
      throw new Error("Payment reconciliation failed");
    await tx.webhookEvent.create({ data: { id: event.id, type: event.type } });
    if (order.status !== "PENDING") return;
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (order.product.kind === "GEMS") {
      await tx.gameState.upsert({
        where: { userId: order.userId },
        create: { userId: order.userId, gems: order.product.gems },
        update: { gems: { increment: order.product.gems } },
      });
      await tx.rewardLedger.create({
        data: {
          userId: order.userId,
          key: `order:${order.id}`,
          gems: order.product.gems,
          reason: "PURCHASE",
        },
      });
    } else {
      await tx.entitlement.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          courseId: order.product.courseId,
          endsAt: order.product.durationDays
            ? new Date(Date.now() + order.product.durationDays * 86400000)
            : null,
        },
      });
    }
  });
  return Response.json({ received: true });
}
