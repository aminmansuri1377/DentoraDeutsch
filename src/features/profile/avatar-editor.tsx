"use client";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useImageUpload } from "@/features/media/use-image-upload";
import styles from "./profile.module.css";
export function AvatarEditor({
  image,
  name,
}: {
  image?: string | null;
  name?: string | null;
}) {
  const upload = useImageUpload("avatar");
  return (
    <div className={styles.avatarEditor}>
      <Avatar image={image} name={name} size={88} />
      <label>
        <Camera size={16} />
        {upload.isPending ? "Wird hochgeladen …" : "Foto ändern"}
        <input
          aria-label="Profilbild hochladen"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={upload.isPending}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) {
              try {
                await upload.mutateAsync(file);
              } catch {}
            }
          }}
        />
      </label>
      <small>JPG, PNG, WebP · max. 2 MB</small>
      {upload.error && <p role="alert">{upload.error.message}</p>}
      {upload.isSuccess && <span role="status">Profilbild gespeichert.</span>}
    </div>
  );
}
