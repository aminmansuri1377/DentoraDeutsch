import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { testModeEnabled } from "./test-mode";
export const DEMO_COOKIE = "dentora.test-session";
export async function createTestSession(email: string) {
  if (!testModeEnabled()) throw new Error("Testanmeldung ist deaktiviert.");
  const user = await db.user.upsert({
    where: { email },
    create: { email, name: email.split("@")[0] },
    update: {},
  });
  const sessionToken = `test_${randomBytes(32).toString("hex")}`;
  const expires = new Date(Date.now() + 86400000);
  await db.session.create({ data: { userId: user.id, sessionToken, expires } });
  (await cookies()).set(DEMO_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.AUTH_URL?.startsWith("https://") ?? false,
    sameSite: "lax",
    path: "/",
    expires,
  });
  return user;
}
export async function testSession() {
  if (!testModeEnabled()) return null;
  const token = (await cookies()).get(DEMO_COOKIE)?.value;
  if (!token?.startsWith("test_")) return null;
  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });
  if (!session || session.expires < new Date()) return null;
  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
    expires: session.expires.toISOString(),
  };
}
export async function clearTestSession() {
  const jar = await cookies();
  const token = jar.get(DEMO_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { sessionToken: token } });
  jar.delete(DEMO_COOKIE);
}
