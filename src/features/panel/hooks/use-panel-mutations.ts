"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import {
  updatePanelList,
  type PanelChange,
  type PanelList,
  type ListInput,
} from "../cache";
import type { PanelModel, PanelRecord } from "../types";

export function usePanelMutations(
  model: PanelModel,
  onDone: () => void,
  previous?: PanelRecord,
) {
  const api = useTRPC();
  const cache = useQueryClient();
  const listFilter = {
    queryKey: api.panel.list.queryKey({ model: model.name }),
  };
  function apply(change: PanelChange) {
    for (const query of cache.getQueryCache().findAll(listFilter)) {
      const input = (query.queryKey[1] as { input?: ListInput } | undefined)
        ?.input;
      if (input && query.state.data) {
        cache.setQueryData<PanelList>(query.queryKey, (data) =>
          data ? updatePanelList(data, input, model, change) : data,
        );
      }
    }
    onDone();
    // Invalidates inactive views too; active views refetch without a browser reload.
    // Related tables may change through cascades, content validation or audit logging.
    void cache.invalidateQueries();
  }
  const save = useMutation(
    api.panel.save.mutationOptions({
      onMutate: () => cache.cancelQueries(listFilter),
      onSuccess: (row) => apply({ kind: "save", row, previous }),
    }),
  );
  const remove = useMutation(
    api.panel.remove.mutationOptions({
      onMutate: () => cache.cancelQueries(listFilter),
      onSuccess: () => {
        if (previous) apply({ kind: "remove", previous });
      },
    }),
  );
  return { save, remove };
}
