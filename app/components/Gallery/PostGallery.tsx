"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "./Lightbox";

export default function PostGallery({ images }: { images: string[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className="columns-2 sm:columns-3 gap-3 space-y-3">
        {images.map((img, i) => (
          <div
            key={i}
            className="break-inside-avoid cursor-pointer"
            onClick={() => setOpen(i)}
          >
            <Image
              src={`/api/image/${img}`}
              alt=""
              width={800}
              height={800}
              className="w-full h-auto"
            />
          </div>
        ))}
      </div>

      {open !== null && (
        <Lightbox images={images} index={open} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
