import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";
const state = vi.hoisted(() => ({ db: null as unknown as PrismaClient }));
vi.mock("@/server/db", () => ({
  get db() {
    return state.db;
  },
}));
vi.mock("@/server/auth", () => ({ auth: async () => null }));
import { appRouter } from "../src/server/routers";
let pg: PGlite, a: string, b: string;
function caller(id: string) {
  return appRouter.createCaller({
    db: state.db,
    session: { user: { id }, expires: "2099-01-01" },
  });
}
beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(
    readFileSync(
      "prisma/migrations/202610280001_initial/migration.sql",
      "utf8",
    ),
  );
  state.db = new PrismaClient({ adapter: new PrismaPGlite(pg) });
  a = (
    await state.db.user.create({
      data: {
        name: "Anna",
        email: "anna@social.test",
        username: "anna",
        image: "/api/media/avatar-a",
      },
    })
  ).id;
  b = (
    await state.db.user.create({
      data: { name: "Ben", email: "ben@social.test", username: "ben" },
    })
  ).id;
});
afterAll(async () => {
  await state.db.$disconnect();
  await pg.close();
});
it("persists following across profile reads and supports unfollowing, without self-follow", async () => {
  const api = caller(a);
  await api.social.follow({ userId: b, follow: true });
  await api.social.follow({ userId: b, follow: true });
  const profile = await api.profile.public({ username: "ben" });
  expect(profile?.following).toBe(true);
  expect(profile?._count.follow_following).toBe(1);
  expect(
    (await api.profile.connections({ userId: b, kind: "followers" })).items[0]
      .id,
  ).toBe(a);
  await expect(
    api.social.follow({ userId: a, follow: true }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await api.social.follow({ userId: b, follow: false });
  expect((await api.profile.public({ username: "ben" }))?.following).toBe(
    false,
  );
});
it("creates, likes, saves, comments and deletes with current counts and author photos", async () => {
  const owner = caller(a),
    viewer = caller(b),
    post = await owner.social.create({ body: "Hallo Community" });
  await viewer.social.like({ postId: post.id, liked: true });
  await viewer.social.like({ postId: post.id, liked: true });
  await viewer.social.save({ postId: post.id, saved: true });
  const comment = await viewer.social.comment({
    postId: post.id,
    body: "Danke!",
  });
  const feed = await viewer.social.feed({ filter: "saved" });
  expect(feed.items[0].author.image).toBe("/api/media/avatar-a");
  expect(feed.items[0]._count).toEqual({ likes: 1, comments: 1 });
  expect(
    (await viewer.social.comments({ postId: post.id })).items[0].body,
  ).toBe("Danke!");
  // Owning the post does not grant permission to delete someone else's comment.
  await expect(
    owner.social.removeComment({ id: comment.id }),
  ).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  expect(
    (await viewer.social.comments({ postId: post.id })).items,
  ).toHaveLength(1);
  await viewer.social.removeComment({ id: comment.id });
  expect(
    (await viewer.social.comments({ postId: post.id })).items,
  ).toHaveLength(0);
  expect(
    (await state.db.comment.findUnique({ where: { id: comment.id } }))
      ?.deletedAt,
  ).toBeInstanceOf(Date);
  await expect(
    viewer.social.removeComment({ id: comment.id }),
  ).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  expect((await viewer.social.feed({})).items[0]._count.comments).toBe(0);
  await expect(viewer.social.remove({ id: post.id })).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  await owner.social.remove({ id: post.id });
  expect((await viewer.social.feed({ filter: "saved" })).items).toHaveLength(0);
  await expect(
    viewer.social.save({ postId: post.id, saved: true }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(
    viewer.social.comments({ postId: post.id }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  expect((await owner.profile.me()).user._count.post_author).toBe(0);
});
it("attaches only an owned unattached image, atomically, and allows image-only posts", async () => {
  const image = await state.db.media.create({
    data: {
      ownerId: a,
      objectKey: "a/photo.webp",
      mimeType: "image/webp",
      size: 100,
      status: "READY",
    },
  });
  const before = await state.db.post.count();
  await expect(
    caller(b).social.create({ body: "", mediaId: image.id }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(await state.db.post.count()).toBe(before);
  const post = await caller(a).social.create({ body: "", mediaId: image.id });
  expect(
    (await caller(b).social.feed({})).items.find((p) => p.id === post.id)
      ?.media_post[0].id,
  ).toBe(image.id);
  await expect(
    caller(a).social.create({ body: "again", mediaId: image.id }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await expect(caller(a).social.create({ body: "   " })).rejects.toMatchObject({
    code: "BAD_REQUEST",
  });
});
it("paginates feeds without duplicates and respects private profiles and id fallback", async () => {
  await state.db.post.createMany({
    data: Array.from({ length: 25 }, (_, i) => ({
      authorId: b,
      body: `Topic ${i}`,
    })),
  });
  const one = await caller(a).social.feed({ search: "Topic" }),
    two = await caller(a).social.feed({
      search: "Topic",
      cursor: one.nextCursor,
    });
  expect(one.items).toHaveLength(20);
  expect(two.items).toHaveLength(5);
  expect(new Set([...one.items, ...two.items].map((p) => p.id)).size).toBe(25);
  await state.db.user.update({
    where: { id: b },
    data: { publicProfile: false },
  });
  expect(await caller(a).profile.public({ username: "ben" })).toBeNull();
  await expect(caller(a).social.feed({ authorId: b })).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  expect((await caller(b).profile.public({ username: "~" + b }))?.isSelf).toBe(
    true,
  );
  expect((await caller(a).profile.public({ username: "~" + a }))?.id).toBe(a);
});
