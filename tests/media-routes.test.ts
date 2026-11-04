import { beforeEach, it, expect, vi } from "vitest";
import sharp from "sharp";
const state = vi.hoisted(() => ({
  viewer: "owner" as string | undefined,
  media: null as any,
  create: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/server/auth", () => ({
  auth: async () => (state.viewer ? { user: { id: state.viewer } } : null),
}));
vi.mock("@/server/db", () => ({
  db: {
    $transaction: async (fn: any) =>
      fn({ media: { create: state.create }, user: { update: state.update } }),
    media: { findUnique: async () => state.media },
  },
}));
vi.mock("@/server/rate-limit", () => ({ limit: async () => true }));
vi.mock("@/server/media/storage", () => ({
  uploadObject: vi.fn(async () => {}),
  deleteObject: vi.fn(async () => {}),
  downloadObject: vi.fn(async () => new Response("image")),
}));
import { POST } from "../src/app/api/media/route";
import { GET } from "../src/app/api/media/[id]/route";
import {
  uploadObject,
  downloadObject,
  deleteObject,
} from "../src/server/media/storage";
beforeEach(() => {
  vi.clearAllMocks();
  state.viewer = "owner";
  state.media = null;
  state.create.mockResolvedValue({});
  state.update.mockResolvedValue({});
  vi.stubEnv("AUTH_URL", "https://dentora.test");
});
function request(
  bytes: Uint8Array,
  origin = "https://dentora.test",
  purpose = "avatar",
) {
  const form = new FormData();
  form.append(
    "file",
    new File([new Uint8Array(bytes)], "test.jpg", { type: "image/jpeg" }),
  );
  form.append("purpose", purpose);
  return new Request("https://dentora.test/api/media", {
    method: "POST",
    headers: { origin },
    body: form,
  });
}
it("rejects unauthenticated and cross-origin uploads before touching storage", async () => {
  expect(
    (await POST(request(new Uint8Array(), "https://evil.test"))).status,
  ).toBe(403);
  state.viewer = undefined;
  expect((await POST(request(new Uint8Array()))).status).toBe(401);
  expect(uploadObject).not.toHaveBeenCalled();
});
it("saves only sanitized images and updates the authenticated user", async () => {
  const input = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "red" },
  })
    .jpeg()
    .toBuffer();
  const response = await POST(request(input));
  expect(response.status).toBe(201);
  expect(vi.mocked(uploadObject).mock.calls[0][0]).toMatch(
    /^avatars\/owner\/[^/]+\.webp$/,
  );
  const result = await response.json();
  expect(result.url).toBe("/api/media/" + result.id);
  expect(state.update).toHaveBeenCalledWith({
    where: { id: "owner" },
    data: { image: result.url },
  });
  expect(
    (await sharp(vi.mocked(uploadObject).mock.calls[0][1]).metadata()).format,
  ).toBe("webp");
});
it("rejects files with a forged image extension and cleans storage after DB failure", async () => {
  expect(
    (await POST(request(new TextEncoder().encode("not jpeg")))).status,
  ).toBe(400);
  const input = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  state.create.mockRejectedValueOnce(new Error("db unavailable"));
  expect((await POST(request(input))).status).toBe(503);
  expect(deleteObject).toHaveBeenCalledOnce();
});
it("does not serve another user’s unattached image or a deleted post image", async () => {
  state.media = {
    ownerId: "other",
    status: "READY",
    objectKey: "secret",
    post: null,
    owner: { image: null },
  };
  const args = { params: Promise.resolve({ id: "picture" }) },
    req = new Request("https://dentora.test/api/media/picture");
  expect((await GET(req, args)).status).toBe(404);
  state.media.post = { deletedAt: new Date() };
  expect((await GET(req, args)).status).toBe(404);
  expect(downloadObject).not.toHaveBeenCalled();
  state.media.post.deletedAt = null;
  expect((await GET(req, args)).status).toBe(200);
  state.viewer = undefined;
  expect((await GET(req, args)).status).toBe(401);
});

it("stores post images in their own folder without changing the avatar", async () => {
  const input = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "blue" },
  })
    .png()
    .toBuffer();
  const response = await POST(request(input, "https://dentora.test", "post"));
  expect(response.status).toBe(201);
  expect(vi.mocked(uploadObject).mock.calls[0][0]).toMatch(
    /^posts\/owner\/[^/]+\.webp$/,
  );
  expect(state.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        status: "READY",
        objectKey: expect.stringMatching(/^posts\//),
      }),
    }),
  );
  expect(state.update).not.toHaveBeenCalled();
});
it("continues serving existing images from their original object key", async () => {
  state.media = {
    ownerId: "owner",
    status: "AVATAR",
    objectKey: "owner/old-avatar.webp",
    post: null,
    owner: { image: "/api/media/old" },
  };
  const response = await GET(
    new Request("https://dentora.test/api/media/old"),
    { params: Promise.resolve({ id: "old" }) },
  );
  expect(response.status).toBe(200);
  expect(downloadObject).toHaveBeenCalledWith("owner/old-avatar.webp");
});
