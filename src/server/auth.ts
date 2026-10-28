import { testSession } from "./demo-session";
import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { createTransport } from "nodemailer";
import { db } from "./db";
import { limit } from "./rate-limit";
export const {
  handlers,
  auth: verifiedAuth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database", maxAge: 60 * 60 * 24 * 14 },
  pages: {
    signIn: "/anmelden",
    verifyRequest: "/anmelden/gesendet",
    error: "/anmelden",
  },
  providers: [
    Nodemailer({
      server: process.env.EMAIL_SERVER ?? { host: "localhost", port: 1025 },
      from: process.env.EMAIL_FROM,
      maxAge: 15 * 60,
      normalizeIdentifier(identifier) {
        const email = identifier.trim().toLowerCase();
        if (
          !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(
            email,
          ) ||
          email.length > 254
        )
          throw new Error("Ungültige E-Mail-Adresse.");
        return email;
      },
      async sendVerificationRequest({ identifier, url, provider }) {
        if (!(await limit(`email:${identifier.toLowerCase()}`, 3, 900)))
          throw new Error("Bitte später erneut versuchen.");
        if (!process.env.EMAIL_SERVER)
          throw new Error("E-Mail-Dienst nicht konfiguriert.");
        await createTransport(provider.server).sendMail({
          to: { address: identifier, name: "" },
          from: provider.from,
          subject: "Dein Anmeldelink für Dentora",
          text: `Melde dich bei Dentora an: ${url}\nDieser Link ist 15 Minuten gültig. Falls du ihn nicht angefordert hast, ignoriere diese E-Mail.`,
        });
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});

export async function auth() {
  return (await testSession()) ?? (await verifiedAuth());
}
