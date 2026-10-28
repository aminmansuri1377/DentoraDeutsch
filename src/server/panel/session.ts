import "server-only";
import { cookies } from "next/headers";
import { verifiedAuth } from "../auth";
import { db } from "../db";
import { testModeEnabled } from "../test-mode";
import { seal, unseal } from "./crypto";
const COOKIE = "dentora.panel";
export async function panelIdentity() {
  if (testModeEnabled()) {
    const token = (await cookies()).get(COOKIE)?.value;
    const data = token
      ? unseal<{ purpose: string; expires: number }>(token)
      : null;
    if (data?.purpose === "panel-login" && data.expires > Date.now())
      return { actorId: null, mode: "test" as const };
    return null;
  }
  const session = await verifiedAuth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "ADMIN"
    ? { actorId: session.user.id, mode: "verified" as const }
    : null;
}
export async function issuePanelSession() {
  if (!testModeEnabled()) throw new Error("Testmodus ist deaktiviert.");
  const expires = Date.now() + 8 * 3600000;
  (await cookies()).set(COOKIE, seal({ purpose: "panel-login", expires }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.AUTH_URL?.startsWith("https://") ?? false,
    path: "/",
    expires: new Date(expires),
  });
}
export async function clearPanelSession() {
  (await cookies()).delete(COOKIE);
}
