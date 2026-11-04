import { randomUUID } from "node:crypto";
import { mediaObjectKey } from "@/server/media/object-key";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { limit } from "@/server/rate-limit";
import { isTrustedMutation } from "@/server/security/request-origin";
import { MAX_UPLOAD_BYTES, prepareImage } from "@/server/media/image";
import { uploadObject, deleteObject } from "@/server/media/storage";
export const runtime = "nodejs";
export const maxDuration = 60;
const error = (message: string, status: number) =>
  Response.json({ message }, { status });
export async function POST(request: Request) {
  if (!isTrustedMutation(request)) return error("Anfrage nicht erlaubt.", 403);
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return error("Bitte melde dich an.", 401);
  if (!(await limit(`image:${userId}`, 12, 3600)))
    return error("Zu viele Uploads. Bitte versuche es später erneut.", 429);
  // Bound the stream itself, not just Content-Length (which may be omitted/forged).
  const reader = request.body?.getReader();
  if (!reader) return error("Bild fehlt.", 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.length;
    if (length > MAX_UPLOAD_BYTES + 65536) {
      await reader.cancel();
      return error("Maximal 2 MB pro Bild.", 413);
    }
    chunks.push(part.value);
  }
  let form: FormData;
  try {
    form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
  } catch {
    return error("Ungültiger Upload.", 400);
  }
  const file = form.get("file"),
    purpose = form.get("purpose");
  if (!(file instanceof File) || !["avatar", "post"].includes(String(purpose)))
    return error("Bitte wähle ein gültiges Bild.", 400);
  let bytes: Buffer;
  try {
    bytes = await prepareImage(
      Buffer.from(await file.arrayBuffer()),
      purpose as "avatar" | "post",
    );
  } catch {
    return error(
      "Bitte wähle ein gültiges JPG-, PNG- oder WebP-Bild (maximal 2 MB, 16 Megapixel).",
      400,
    );
  }
  const id = randomUUID(),
    objectKey = mediaObjectKey(purpose as "avatar" | "post", userId, id);
  try {
    await uploadObject(objectKey, bytes);
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Upload fehlgeschlagen.",
      503,
    );
  }
  try {
    await db.$transaction(async (tx) => {
      await tx.media.create({
        data: {
          id,
          ownerId: userId,
          objectKey,
          mimeType: "image/webp",
          size: bytes.length,
          status: purpose === "avatar" ? "AVATAR" : "READY",
        },
      });
      if (purpose === "avatar")
        await tx.user.update({
          where: { id: userId },
          data: { image: `/api/media/${id}` },
        });
    });
    return Response.json({ id, url: `/api/media/${id}` }, { status: 201 });
  } catch {
    await deleteObject(objectKey).catch(() => {});
    return error(
      "Das Bild konnte nicht zugeordnet werden. Bitte versuche es erneut.",
      503,
    );
  }
}
