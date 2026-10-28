"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { Loading, ErrorNotice } from "@/components/ui/feedback";
export function ProfilePage() {
  const api = useTRPC();
  const me = useQuery(api.profile.me.queryOptions()),
    badges = useQuery(api.profile.badges.queryOptions()),
    certificates = useQuery(api.profile.certificates.queryOptions());
  if (me.isPending) return <Loading />;
  if (me.error) return <ErrorNotice message={me.error.message} />;
  const { user, game } = me.data;
  return (
    <>
      <PageHeading
        eyebrow="DEINE LERNREISE"
        title={user.name ?? "Dein Profil"}
        description={user.bio || "Hier wächst dein Wissen mit dir."}
      >
        <Link className="button secondary" href="/einstellungen">
          Profil bearbeiten
        </Link>
      </PageHeading>
      <div className="three-grid">
        {[
          [game.xp, "Erfahrungspunkte"],
          [game.streak, "Tage in Folge"],
          [certificates.data?.length ?? 0, "Zertifikate"],
        ].map(([value, label]) => (
          <Card key={label}>
            <span className="eyebrow">{label}</span>
            <h2>{value}</h2>
          </Card>
        ))}
      </div>
      <div className="profile-menu">
        {[
          [
            "/gespeichert",
            "Gespeicherte Inhalte",
            "Lektionen, Markierungen und Wiederholungen",
          ],
          ["/shop", "Shop & Pro", "Kurse und Extras entdecken"],
          [
            "/einstellungen",
            "Einstellungen",
            "Profil, Lernziel und Datenschutz",
          ],
          ["/hilfe", "Hilfe & Support", "Wir helfen dir weiter"],
        ].map(([href, title, subtitle]) => (
          <Link key={href} href={href}>
            <div>
              <strong>{title}</strong>
              <small>{subtitle}</small>
            </div>
            <span>›</span>
          </Link>
        ))}
      </div>
      <h2>Deine Meilensteine</h2>
      <div className="three-grid">
        {badges.data?.map((b) => (
          <Card
            key={b.id}
            className={b.awards.length ? "badge-card earned" : "badge-card"}
          >
            <span>✧</span>
            <h3>{b.title}</h3>
            <p>{b.description}</p>
            <small>
              {b.awards.length ? "Erreicht" : "Noch nicht erreicht"}
            </small>
          </Card>
        ))}
      </div>
      <h2>Deine Zertifikate</h2>
      <Card>
        {certificates.data?.length ? (
          certificates.data.map((c) => (
            <p key={c.id}>
              <Link className="text-link" href={`/zertifikat/${c.code}`}>
                {c.courseSnapshot} →
              </Link>
            </p>
          ))
        ) : (
          <p>
            Schließe einen vollständigen Kurs ab, um dein Zertifikat zu
            erhalten.
          </p>
        )}
      </Card>
    </>
  );
}
