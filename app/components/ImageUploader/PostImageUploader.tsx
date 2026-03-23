"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { PostImage } from "./post-types";

type Props = {
  slug: string;
  onChange: (images: PostImage[]) => void;
};

export default function PostImageUploader({ slug, onChange }: Props) {
  const [images, setImages] = useState<PostImage[]>([]);

  /* ========= rename with index ========= */

  const rebuild = (imgs: PostImage[]) => {
    return imgs.map((img, index) => {
      const file = new File([img.file], `${slug}_${index}.webp`, {
        type: "image/webp",
      });

      return {
        ...img,
        file,
      };
    });
  };

  /* ========= add ========= */

  const addFiles = async (files: FileList | null) => {
    if (!files) return;

    const list: PostImage[] = [];

    for (const f of Array.from(files)) {
      const blob = await toWebp(f);

      list.push({
        id: uuid(),
        file: new File([blob], "temp.webp", {
          type: "image/webp",
        }),
        previewUrl: URL.createObjectURL(blob),
      });
    }

    const next = rebuild([...images, ...list]);

    setImages(next);
    onChange(next);
  };

  /* ========= remove ========= */

  const remove = (id: string) => {
    const next = rebuild(images.filter((i) => i.id !== id));

    setImages(next);
    onChange(next);
  };

  /* ========= reorder ========= */

  const move = (from: number, to: number) => {
    const copy = [...images];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);

    const next = rebuild(copy);

    setImages(next);
    onChange(next);
  };

  /* ========= UI ========= */

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => addFiles(e.target.files)}
      />

      <div className="grid grid-cols-4 gap-3 mt-4">
        {images.map((img, i) => (
          <div
            key={img.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("index", i.toString())}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const from = Number(e.dataTransfer.getData("index"));
              move(from, i);
            }}
            className="relative"
          >
            <img src={img.previewUrl} className="rounded-lg" />

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
    </div>
  );
}

/* ========= convert ========= */

async function toWebp(file: File) {
  const img = await createImageBitmap(file);

  const canvas = document.createElement("canvas");

  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(img, 0, 0);

  return await new Promise<Blob>((res) =>
    canvas.toBlob((b) => res(b!), "image/webp", 0.9),
  );
}
