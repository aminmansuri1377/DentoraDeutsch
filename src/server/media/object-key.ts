/** New uploads are grouped by purpose; existing Media.objectKey values stay valid. */
export function mediaObjectKey(
  purpose: "avatar" | "post",
  userId: string,
  id: string,
) {
  const folder = purpose === "avatar" ? "avatars" : "posts";
  return `${folder}/${encodeURIComponent(userId)}/${id}.webp`;
}
