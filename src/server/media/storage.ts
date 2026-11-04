import "server-only";
function settings() {
  const raw = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw || !key)
    throw new Error(
      "Der Bildupload ist noch nicht eingerichtet. Bitte kontaktiere den Support.",
    );
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("Ungültige Storage-Konfiguration.");
  const bucket = process.env.SUPABASE_MEDIA_BUCKET || "dentora-media";
  if (!/^[a-z0-9-]+$/.test(bucket))
    throw new Error("Ungültige Storage-Konfiguration.");
  return {
    base: `${url.origin}/storage/v1`,
    bucket,
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  };
}
// Only server-generated, unique object keys may be passed here. Reusing the
// same key and bytes makes a retry safe even if the first response was lost.
export async function uploadObject(key: string, bytes: Buffer) {
  const s = settings();
  const url = `${s.base}/object/${s.bucket}/${key}`;
  const retryable = new Set([408, 429, 500, 502, 503, 504]);
  for (let attempt = 1; attempt <= 3; attempt++) {
    let status: number | undefined;
    let networkFailure = false;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...s.headers,
          "Content-Type": "image/webp",
          "x-upsert": "true",
        },
        body: new Uint8Array(bytes),
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      });
      status = response.status;
      await response.body?.cancel();
      if (response.ok) return;
    } catch (error) {
      networkFailure = true;
      // Never log URLs, credentials, response bodies or arbitrary error messages.
      const cause = error instanceof Error ? error.cause : undefined;
      const rawCode =
        cause && typeof cause === "object" && "code" in cause
          ? String(cause.code)
          : error instanceof Error
            ? error.name
            : "UNKNOWN";
      const code = /^[A-Za-z0-9_]{1,60}$/.test(rawCode) ? rawCode : "UNKNOWN";
      console.warn("[media:storage-upload]", { attempt, code });
      if (/CERT|TLS|SSL/.test(code)) {
        throw new Error(
          "Die sichere Verbindung zum Bildspeicher ist fehlgeschlagen. Bitte kontaktiere den Support.",
        );
      }
    }
    if (status !== undefined) {
      console.warn("[media:storage-upload]", { attempt, status });
      if (!retryable.has(status))
        throw new Error(
          "Der Bildspeicher hat den Upload abgelehnt. Bitte prüfe die Storage-Konfiguration.",
        );
    }
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 400));
      continue;
    }
    throw new Error(
      networkFailure
        ? "Der Bildspeicher ist momentan nicht erreichbar. Dein Text bleibt erhalten. Bitte versuche den Bildupload erneut."
        : "Der Bildspeicher ist momentan ausgelastet. Bitte versuche den Bildupload erneut.",
    );
  }
}
export async function downloadObject(key: string) {
  const s = settings();
  return fetch(
    `${s.base}/object/authenticated/${s.bucket}/${key.split("/").map(encodeURIComponent).join("/")}`,
    {
      headers: s.headers,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    },
  );
}
export async function deleteObject(key: string) {
  const s = settings();
  const response = await fetch(`${s.base}/object/${s.bucket}`, {
    method: "DELETE",
    headers: { ...s.headers, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [key] }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Storage cleanup failed");
}
