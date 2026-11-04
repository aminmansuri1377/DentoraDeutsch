export function profileHref(user: { id: string; username?: string | null }) {
  return `/u/${encodeURIComponent(user.username || "~" + user.id)}`;
}
