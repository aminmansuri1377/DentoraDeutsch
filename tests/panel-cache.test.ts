import { it, expect } from "vitest";
import { updatePanelList } from "@/features/panel/cache";
import { metadata } from "@/server/panel/registry";
const model = metadata("Course");
const old = { key: "old-encrypted-key", values: { id: "1", title: "Alt" } };
const updated = { key: "new-encrypted-key", values: { id: "1", title: "Neu" } };
const input = { model: "Course", page: 0, search: "" };
it("updates rows even when refetch generated a new encrypted key", () => {
  const data = { rows: [{ ...old, key: "another-key" }], total: 1, pages: 1 };
  const result = updatePanelList(data, input, model, {
    kind: "save",
    row: updated,
    previous: old,
  });
  expect(result.rows).toEqual([updated]);
  expect(result.total).toBe(1);
});
it("shows confirmed creates and deletes without a refetch", () => {
  const created = updatePanelList(
    { rows: [], total: 0, pages: 0 },
    input,
    model,
    { kind: "save", row: old },
  );
  expect(created.rows).toEqual([old]);
  const deleted = updatePanelList(created, input, model, {
    kind: "remove",
    previous: old,
  });
  expect(deleted).toEqual({ rows: [], total: 0, pages: 0 });
});
it("reconciles search membership and pagination counts", () => {
  const result = updatePanelList(
    { rows: [old], total: 21, pages: 2 },
    { ...input, page: 1, search: "Alt" },
    model,
    { kind: "save", row: updated, previous: old },
  );
  expect(result).toEqual({ rows: [], total: 20, pages: 1 });
});
