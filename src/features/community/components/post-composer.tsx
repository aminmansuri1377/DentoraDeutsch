"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Send, X } from "lucide-react";
import { useTRPC } from "@/trpc/provider";
import { useImageUpload } from "@/features/media/use-image-upload";
import { useSocialRefresh } from "../use-social-refresh";
import styles from "../community.module.css";
export function PostComposer({
  onClose,
  onPublished,
}: {
  onClose: () => void;
  onPublished: () => void;
}) {
  const [body, setBody] = useState(""),
    [pendingFile, setPendingFile] = useState<File | null>(null),
    [media, setMedia] = useState<{ id: string; url: string } | null>(null);
  const api = useTRPC(),
    refresh = useSocialRefresh(),
    upload = useImageUpload("post");
  const create = useMutation(
    api.social.create.mutationOptions({
      onSuccess: async () => {
        setBody("");
        setMedia(null);
        await refresh();
        onPublished();
      },
    }),
  );
  async function uploadFile(file: File) {
    setPendingFile(file);
    try {
      setMedia(await upload.mutateAsync(file));
      setPendingFile(null);
    } catch {
      // Keep the selected file and text so the user can retry.
    }
  }
  const busy = create.isPending || upload.isPending;
  return (
    <section className={styles.composer} aria-label="Neuen Beitrag erstellen">
      <div className={styles.editorHeading}>
        <h2>Was möchtest du teilen?</h2>
        <button aria-label="Editor schließen" disabled={busy} onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy && !pendingFile)
            create.mutate({ body, mediaId: media?.id });
        }}
      >
        <label htmlFor="post-body">Dein Beitrag</label>
        <textarea
          autoFocus
          id="post-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          rows={5}
          placeholder="Eine Frage, ein Gedanke oder ein Lernerfolg …"
        />
        {media && (
          <div className={styles.imagePreview}>
            <img src={media.url} alt="Vorschau des Beitragsbildes" />
            <button
              type="button"
              disabled={busy}
              onClick={() => setMedia(null)}
              aria-label="Bild entfernen"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className={styles.editorActions}>
          <label className={styles.attach}>
            <ImagePlus size={20} />
            {upload.isPending ? "Bild wird hochgeladen …" : "Bild hinzufügen"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) {
                  await uploadFile(file);
                }
              }}
            />
          </label>
          <button
            className="button primary"
            disabled={busy || !!pendingFile || (!body.trim() && !media)}
          >
            <Send size={16} />
            {create.isPending ? "Wird veröffentlicht …" : "Veröffentlichen"}
          </button>
        </div>
        {/* <small>JPG, PNG oder WebP · max. 2 MB · {body.length}/5000</small> */}
        {pendingFile && upload.isError && (
          <div className={styles.editorActions}>
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => void uploadFile(pendingFile)}
            >
              Bildupload erneut versuchen
            </button>
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => {
                setPendingFile(null);
                upload.reset();
              }}
            >
              Bildauswahl verwerfen
            </button>
          </div>
        )}
        {(upload.error || create.error) && (
          <p role="alert" className={styles.error}>
            {upload.error?.message || create.error?.message}
          </p>
        )}
      </form>
    </section>
  );
}
