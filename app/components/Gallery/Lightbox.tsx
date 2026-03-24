"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  images: string[];
  index: number;
  onClose: () => void;
};

export default function Lightbox({ images, index, onClose }: Props) {
  const [i, setI] = useState(index);

  const prev = () => setI((v) => (v - 1 + images.length) % images.length);

  const next = () => setI((v) => (v + 1) % images.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        className="absolute left-4 text-white text-3xl"
      >
        ‹
      </button>

      <div
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={`/api/image/${images[i]}`}
          alt=""
          width={1200}
          height={1200}
          className="max-h-[90vh] w-auto h-auto"
        />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        className="absolute right-4 text-white text-3xl"
      >
        ›
      </button>
    </div>
  );
}
