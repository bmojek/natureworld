"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (!images?.length) return null;

  const prev = () => {
    if (active > 0) setActive((p) => p - 1);
  };

  const next = () => {
    if (active < images.length - 1) setActive((p) => p + 1);
  };

  return (
    <div className="space-y-4">
      {/* ================= MAIN IMAGE ================= */}

      <div className="bg-white rounded-2xl p-2 relative group">
        {/* ARROWS */}

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={active === 0}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 
                bg-white/80 backdrop-blur p-2 rounded-full shadow transition
                ${
                  active === 0
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-white"
                }`}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={next}
              disabled={active === images.length - 1}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 
                bg-white/80 backdrop-blur p-2 rounded-full shadow transition
                ${
                  active === images.length - 1
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-white"
                }`}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* IMAGE */}

        <div className="relative w-full aspect-square overflow-hidden rounded-xl">
          <Image
            src={`/api/image/${images[active]}_main.webp`}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 520px"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      {/* ================= THUMBS ================= */}

      <div className="flex gap-3 flex-wrap">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-20 h-20 rounded-xl border overflow-hidden bg-white transition
              ${
                i === active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-gray-200 hover:border-primary"
              }`}
          >
            <Image
              src={`/api/image/${img}_thumb.webp`}
              alt=""
              width={80}
              height={80}
              className="object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
