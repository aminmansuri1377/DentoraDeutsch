import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { downloadObject } from "@/server/media/storage";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = (await auth())?.user?.id;
  if (!viewer) return new Response(null, { status: 401 });
  const { id } = await params;
  const media = await db.media.findUnique({
    where: { id },
    include: {
      post: { select: { deletedAt: true } },
      owner: { select: { image: true } },
    },
  });
  // Unattached post images and replaced avatars are visible only to their owner.
  const visible =
    media &&
    (media.ownerId === viewer ||
      (media.status === "AVATAR" && media.owner.image === `/api/media/${id}`) ||
      (media.status === "READY" && media.post && !media.post.deletedAt));
  if (!visible) return new Response(null, { status: 404 });
  try {
    const response = await downloadObject(media.objectKey);
    if (!response.ok) return new Response(null, { status: 404 });
    return new Response(response.body, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
