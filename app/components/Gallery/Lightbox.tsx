"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  images: string[];
  index: number;
  onClose: () => void;
};

export default function Lightbox({ images, index, onClose }: Props) {
  const [i, setI] = useState(index);

  const prev = () => setI((value) => (value - 1 + images.length) % images.length);

  const next = () => setI((value) => (value + 1) % images.length);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={(event) => {
          event.stopPropagation();
          prev();
        }}
        className="absolute left-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
        aria-label="Poprzednie zdjęcie"
      >
        <ChevronLeft size={28} />
      </button>

      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src={`/api/image/${images[i]}`}
          alt=""
          width={1200}
          height={1200}
          className="h-auto max-h-[90vh] w-auto"
        />
      </div>

      <button
        onClick={(event) => {
          event.stopPropagation();
          next();
        }}
        className="absolute right-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
        aria-label="Następne zdjęcie"
      >
        <ChevronRight size={28} />
      </button>

      <button
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
        aria-label="Zamknij galerię"
      >
        <X size={24} />
      </button>
    </div>
  );
}
