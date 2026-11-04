"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
export function useSocialRefresh() {
  const api = useTRPC(),
    cache = useQueryClient();
  return () =>
    Promise.all([
      cache.invalidateQueries({ queryKey: api.social.pathKey() }),
      cache.invalidateQueries({ queryKey: api.profile.pathKey() }),
    ]);
}
