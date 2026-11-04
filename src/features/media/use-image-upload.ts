"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
export function useImageUpload(purpose: "avatar" | "post") {
  const api = useTRPC(),
    cache = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 2 * 1024 * 1024)
        throw new Error("Das Bild darf maximal 2 MB groß sein.");
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error("Bitte wähle JPG, PNG oder WebP.");
      const form = new FormData();
      form.set("file", file);
      form.set("purpose", purpose);
      let response: Response;
      try {
        response = await fetch("/api/media", {
          method: "POST",
          body: form,
        });
      } catch {
        throw new Error(
          "Die Verbindung zur App wurde unterbrochen. Bitte versuche den Bildupload erneut.",
        );
      }
      let result: { id: string; url: string; message?: string };
      try {
        result = await response.json();
      } catch {
        throw new Error("Upload fehlgeschlagen. Bitte versuche es erneut.");
      }
      if (!response.ok)
        throw new Error(result.message || "Upload fehlgeschlagen.");
      return result;
    },
    onSuccess: async () => {
      if (purpose === "avatar")
        await Promise.all([
          cache.invalidateQueries({ queryKey: api.profile.pathKey() }),
          cache.invalidateQueries({ queryKey: api.social.pathKey() }),
        ]);
    },
  });
}
