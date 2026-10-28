// @vitest-environment jsdom
import React from "react";
import { afterEach, it, expect, vi } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { metadata } from "@/server/panel/registry";
const handlers = vi.hoisted(() => ({ save: vi.fn(), remove: vi.fn() }));
vi.mock("@/trpc/provider", () => ({
  useTRPC: () => ({
    panel: {
      list: {
        queryKey: (input: unknown) => [
          ["panel", "list"],
          { input, type: "query" },
        ],
      },
      save: {
        mutationOptions: (options: object) => ({
          ...options,
          mutationFn: handlers.save,
        }),
      },
      remove: {
        mutationOptions: (options: object) => ({
          ...options,
          mutationFn: handlers.remove,
        }),
      },
    },
  }),
}));
import { usePanelMutations } from "@/features/panel/hooks/use-panel-mutations";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const model = metadata("Course");
const row = { key: "key1", values: { id: "id1", title: "Test" } };
const key = [
  ["panel", "list"],
  { input: { model: "Course", page: 0, search: "" }, type: "query" },
];
function setup(previous?: typeof row) {
  const cache = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  cache.setQueryData(key, {
    rows: previous ? [previous] : [],
    total: previous ? 1 : 0,
    pages: previous ? 1 : 0,
  });
  const done = vi.fn();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={cache}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => usePanelMutations(model, done, previous), {
    wrapper,
  });
  return { cache, done, ...hook };
}
it("create immediately updates the query cache and invalidates dependent views", async () => {
  handlers.save.mockResolvedValue(row);
  const { cache, result, done } = setup();
  await act(async () => {
    await result.current.save.mutateAsync({
      model: "Course",
      data: { title: "Test" },
    });
  });
  expect(cache.getQueryData(key)).toMatchObject({ rows: [row], total: 1 });
  expect(cache.getQueryState(key)?.isInvalidated).toBe(true);
  expect(done).toHaveBeenCalledTimes(1);
});
it("edit and delete update visible data before any network refetch", async () => {
  const updated = { ...row, values: { ...row.values, title: "Geändert" } };
  handlers.save.mockResolvedValue(updated);
  handlers.remove.mockResolvedValue({ deleted: true });
  const { cache, result } = setup(row);
  await act(async () => {
    await result.current.save.mutateAsync({
      model: "Course",
      key: row.key,
      data: { title: "Geändert" },
    });
  });
  expect(cache.getQueryData(key)).toMatchObject({ rows: [updated], total: 1 });
  await act(async () => {
    await result.current.remove.mutateAsync({
      model: "Course",
      key: row.key,
      confirmation: "LÖSCHEN",
    });
  });
  expect(cache.getQueryData(key)).toMatchObject({ rows: [], total: 0 });
});
it("failed mutations keep the previous row and dialog open", async () => {
  handlers.save.mockRejectedValue(new Error("Speichern fehlgeschlagen"));
  const { cache, result, done } = setup(row);
  await act(async () => {
    await expect(
      result.current.save.mutateAsync({
        model: "Course",
        key: row.key,
        data: { title: "Neu" },
      }),
    ).rejects.toThrow();
  });
  expect(cache.getQueryData(key)).toMatchObject({ rows: [row] });
  expect(done).not.toHaveBeenCalled();
});
