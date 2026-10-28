"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { useAction } from "@/hooks/use-action";
import { euro } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { Loading, ErrorNotice } from "@/components/ui/feedback";
export function ShopPage() {
  const api = useTRPC(),
    cache = useQueryClient(),
    action = useAction();
  const products = useQuery(api.shop.products.queryOptions()),
    checkout = useMutation(api.shop.checkout.mutationOptions()),
    exchange = useMutation(api.game.exchange.mutationOptions());
  return (
    <>
      <PageHeading
        eyebrow="MEHR RAUM FÜR DEINE NEUGIER"
        title="Investiere in deinen nächsten Schritt."
        description="Vertiefe dein Wissen mit spezialisierten Lernangeboten."
      />
      {products.isPending ? (
        <Loading />
      ) : products.error ? (
        <ErrorNotice message={products.error.message} />
      ) : (
        <div className="three-grid">
          {products.data.map((p) => (
            <Card key={p.id} className="product-card">
              <span className="pill">
                {p.kind === "PRO"
                  ? "DENTORA PRO"
                  : p.kind === "COURSE"
                    ? "SPEZIALKURS"
                    : "DIAMANTEN"}
              </span>
              <h2>{p.title}</h2>
              <p>{p.description}</p>
              <strong className="price">{euro(p.priceCents)}</strong>
              <small>
                {p.durationDays
                  ? `${p.durationDays} Tage · Einmalzahlung`
                  : "Einmalzahlung"}
              </small>
              <Button
                disabled={!p.active || action.pending}
                onClick={() =>
                  action.run(async () => {
                    const result = await checkout.mutateAsync({
                      productId: p.id,
                    });
                    if (result.url) window.location.assign(result.url);
                  }, "")
                }
              >
                {p.active ? "Zum sicheren Checkout" : "Noch nicht buchbar"}
              </Button>
            </Card>
          ))}
        </div>
      )}
      <h2>Für deine Lernroutine</h2>
      <div className="two-grid">
        {(
          [
            ["HEART", "Ein neues Herz", "5 Diamanten"],
            ["GUARD", "Streak-Schutz", "25 Diamanten"],
          ] as const
        ).map(([item, title, cost]) => (
          <Card key={item}>
            <h3>{title}</h3>
            <p>{cost}</p>
            <Button
              variant="secondary"
              disabled={action.pending}
              onClick={() =>
                action.run(async () => {
                  await exchange.mutateAsync({ item });
                  await cache.invalidateQueries();
                })
              }
            >
              Diamanten eintauschen
            </Button>
          </Card>
        ))}
      </div>
      {action.message && (
        <p role="status" className="notice">
          {action.message}
        </p>
      )}
    </>
  );
}
