"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { testModeEnabled } from "@/server/test-mode";
import { issuePanelSession, clearPanelSession } from "@/server/panel/session";
import { matchesSecret } from "@/server/panel/crypto";
import { limit } from "@/server/rate-limit";
export async function panelLogin(_state: { error: string }, form: FormData) {
  if (!testModeEnabled())
    return {
      error: "Bitte melde dich mit deinem bestätigten Administratorkonto an.",
    };
  try {
    const ip =
      (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
    if (!(await limit(`panel-login:${ip}`, 5, 900)))
      return { error: "Zu viele Versuche. Bitte warte 15 Minuten." };
    const password = String(form.get("password") ?? "");
    if (
      password.length > 200 ||
      !matchesSecret(password, process.env.PANEL_PASSWORD ?? "1111")
    )
      return { error: "Das Passwort ist nicht korrekt." };
    await issuePanelSession();
  } catch {
    return {
      error: "Panel nicht verfügbar. Bitte prüfe Datenbank und AUTH_SECRET.",
    };
  }
  redirect("/panel");
}
export async function panelLogout() {
  await clearPanelSession();
  redirect("/panel");
}
