import { it, expect } from "vitest";
import sharp from "sharp";
import { prepareImage, MAX_UPLOAD_BYTES } from "../src/server/media/image";
it("decodes and re-encodes avatars with bounded dimensions and no metadata", async () => {
  const source = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "#9955bb" },
  })
    .jpeg()
    .withMetadata()
    .toBuffer();
  const image = await prepareImage(source, "avatar"),
    meta = await sharp(image).metadata();
  expect(meta.format).toBe("webp");
  expect(meta.width).toBe(384);
  expect(meta.height).toBe(384);
  expect(meta.exif).toBeUndefined();
});
it("rejects disguised files, SVG and oversized images", async () => {
  await expect(
    prepareImage(Buffer.from("not an image"), "post"),
  ).rejects.toThrow();
  await expect(
    prepareImage(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
      ),
      "post",
    ),
  ).rejects.toThrow();
  await expect(
    prepareImage(Buffer.alloc(MAX_UPLOAD_BYTES + 1), "avatar"),
  ).rejects.toThrow();
});
