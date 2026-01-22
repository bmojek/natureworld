"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import ImageCropper from "./ImageCropper";
import { PreparedImage } from "./types";

type Props = {
  productSlug: string;
  onChange: (images: PreparedImage[]) => void;
};

export default function ImageUploader({ productSlug, onChange }: Props) {
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  /* ================= HELPERS ================= */

  const rebuildFilesWithIndexes = (imgs: PreparedImage[]) => {
    return imgs.map((img, index) => {
      const main = new File([img.main], `${productSlug}_${index}_main.webp`, {
        type: "image/webp",
      });

      const thumb = new File(
        [img.thumb],
        `${productSlug}_${index}_thumb.webp`,
        {
          type: "image/webp",
        },
      );

      return {
        ...img,
        main,
        thumb,
      };
    });
  };

  /* ================= ADD FILE ================= */

  const addFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    setPendingFile(files[0]);
    setCropSrc(URL.createObjectURL(files[0]));
  };

  /* ================= CROP CONFIRM ================= */

  const onCropConfirm = (mainBlob: Blob, thumbBlob: Blob) => {
    if (!pendingFile) return;

    const newImage: PreparedImage = {
      id: uuid(),
      main: new File([mainBlob], "temp_main.webp", { type: "image/webp" }),
      thumb: new File([thumbBlob], "temp_thumb.webp", { type: "image/webp" }),
      previewUrl: URL.createObjectURL(mainBlob),
    };

    const next = rebuildFilesWithIndexes([...images, newImage]);

    setImages(next);
    onChange(next);
    setCropSrc(null);
    setPendingFile(null);
  };

  /* ================= REMOVE ================= */

  const remove = (id: string) => {
    const next = rebuildFilesWithIndexes(images.filter((i) => i.id !== id));
    setImages(next);
    onChange(next);
  };

  /* ================= REORDER ================= */

  const move = (from: number, to: number) => {
    if (from === to) return;

    const copy = [...images];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);

    const next = rebuildFilesWithIndexes(copy);
    setImages(next);
    onChange(next);
  };

  /* ================= UI ================= */

  return (
    <>
      {cropSrc && (
        <ImageCropper
          image={cropSrc}
          onCancel={() => {
            setCropSrc(null);
            setPendingFile(null);
          }}
          onConfirm={onCropConfirm}
        />
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => addFiles(e.target.files)}
      />

      <div className="grid grid-cols-4 gap-3 mt-4">
        {images.map((img, i) => (
          <div
            key={img.id}
            className="relative"
            draggable
            onDragStart={(e) => e.dataTransfer.setData("index", i.toString())}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const from = Number(e.dataTransfer.getData("index"));
              move(from, i);
            }}
          >
            <img
              src={img.previewUrl}
              className="rounded-lg cursor-move select-none"
            />

            <button
              type="button"
              onClick={() => remove(img.id)}
              className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
