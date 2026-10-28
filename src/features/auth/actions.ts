"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createTestSession, clearTestSession } from "@/server/demo-session";
import { testModeEnabled } from "@/server/test-mode";
import { limit } from "@/server/rate-limit";
import { signIn, signOut } from "@/server/auth";
export async function loginAction(_state: { error: string }, form: FormData) {
  const parsed = z
    .email()
    .max(254)
    .safeParse(
      String(form.get("email") ?? "")
        .trim()
        .toLowerCase(),
    );
  if (!parsed.success)
    return { error: "Bitte gib eine gültige E-Mail-Adresse ein." };
  if (testModeEnabled()) {
    try {
      if (!(await limit(`test-login:${parsed.data}`, 10, 900)))
        return { error: "Zu viele Versuche. Bitte versuche es später erneut." };
      await createTestSession(parsed.data);
    } catch {
      return {
        error: "Anmeldung nicht möglich. Bitte prüfe die Datenbankverbindung.",
      };
    }
    redirect("/lernen");
  }
  await signIn("nodemailer", { email: parsed.data, redirectTo: "/lernen" });
  return { error: "" };
}
export async function logoutAction() {
  await clearTestSession();
  await signOut({ redirectTo: "/anmelden" });
}
