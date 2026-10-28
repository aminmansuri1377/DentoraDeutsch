import { notFound } from "next/navigation";
import { db } from "@/server/db";
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const certificate = await db.certificate.findFirst({
    where: { code, revokedAt: null, user: { publicProfile: true } },
  });
  if (!certificate) notFound();
  return (
    <main className="auth-screen">
      <article className="certificate">
        <span className="brand">✦ dentora</span>
        <p>TEILNAHMEZERTIFIKAT</p>
        <h1>{certificate.nameSnapshot}</h1>
        <p>hat den Lernkurs</p>
        <h2>{certificate.courseSnapshot}</h2>
        <p>
          am {certificate.issuedAt.toLocaleDateString("de-DE")} abgeschlossen.
        </p>
        <small>
          Prüfcode: {certificate.code}
          <br />
          Lernnachweis · Keine berufsrechtliche Qualifikation
        </small>
      </article>
    </main>
  );
}
