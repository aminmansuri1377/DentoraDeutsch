import sharp from "sharp";
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export async function prepareImage(input: Buffer, purpose: "avatar" | "post") {
  if (!input.length || input.length > MAX_UPLOAD_BYTES)
    throw new Error("Bitte wähle ein Bild mit maximal 2 MB.");
  const image = sharp(input, {
    limitInputPixels: 16_000_000,
    animated: false,
    failOn: "error",
  });
  const meta = await image.metadata();
  if (
    !["jpeg", "png", "webp"].includes(meta.format ?? "") ||
    (meta.pages ?? 1) > 1
  )
    throw new Error("Erlaubt sind JPG, PNG und WebP ohne Animation.");
  const size = purpose === "avatar" ? 384 : 1440;
  const result = await image
    .rotate()
    .resize(size, size, {
      fit: purpose === "avatar" ? "cover" : "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
  if (result.length > MAX_UPLOAD_BYTES)
    throw new Error("Das Bild ist zu groß. Bitte wähle ein kleineres Bild.");
  return result;
}
