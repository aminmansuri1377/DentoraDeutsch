import "./load-env";
const raw = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY,
  bucket = process.env.SUPABASE_MEDIA_BUCKET || "dentora-media";
try {
  if (!raw || !key)
    throw new Error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY fehlen.");
  const url = new URL(raw);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !/^[a-z0-9-]+$/.test(bucket)
  )
    throw new Error("Ungültige Storage-Konfiguration.");
  const base = `${url.origin}/storage/v1/bucket`,
    headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };
  const existing = await fetch(`${base}/${bucket}`, {
    headers,
    signal: AbortSignal.timeout(15000),
  });
  if (existing.ok) {
    const data = await existing.json();
    if (data.public)
      throw new Error(
        "Der vorhandene Bucket ist öffentlich. Bitte stelle ihn in Supabase auf Private.",
      );
    console.log("STORAGE_OK: Privater Bucket vorhanden.");
  } else {
    // Supabase can return 400 or 404 for an absent bucket; distinguish auth errors.
    const detail = await existing.json().catch(() => ({}));
    if (!["404", 404].includes(detail.statusCode) && existing.status !== 404)
      throw new Error(
        "Bucket konnte nicht geprüft werden. Prüfe URL und service_role-Schlüssel.",
      );
    const created = await fetch(base, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: bucket,
        name: bucket,
        public: false,
        file_size_limit: 2097152,
        allowed_mime_types: ["image/webp"],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!created.ok)
      throw new Error(
        "Bucket konnte nicht erstellt werden. Prüfe die Storage-Konfiguration.",
      );
    console.log("STORAGE_OK: Privater Bucket dentora-media eingerichtet.");
  }
} catch (e) {
  console.error(
    e instanceof Error ? e.message : "Storage-Einrichtung fehlgeschlagen.",
  );
  process.exitCode = 1;
}
