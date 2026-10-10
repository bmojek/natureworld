"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getProductImageUrl } from "@/app/lib/product-images";

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
              type="button"
              onClick={prev}
              disabled={active === 0}
              aria-label="Poprzednie zdjęcie"
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 
                bg-white/95 text-[#304a37] backdrop-blur p-2 rounded-full shadow transition disabled:cursor-not-allowed disabled:text-[#77847a]
                ${
                  active === 0
                    ? "cursor-not-allowed"
                    : "hover:bg-white"
                }`}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={next}
              disabled={active === images.length - 1}
              aria-label="Następne zdjęcie"
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 
                bg-white/95 text-[#304a37] backdrop-blur p-2 rounded-full shadow transition disabled:cursor-not-allowed disabled:text-[#77847a]
                ${
                  active === images.length - 1
                    ? "cursor-not-allowed"
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
            src={getProductImageUrl(images[active], "main")}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 520px"
            unoptimized
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      {/* ================= THUMBS ================= */}

      <div className="flex gap-3 flex-wrap">
        {images.map((img, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Pokaż zdjęcie ${i + 1} z ${images.length}`}
            aria-pressed={i === active}
            className={`w-20 h-20 rounded-xl border overflow-hidden bg-white transition
              ${
                i === active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-gray-200 hover:border-primary"
              }`}
          >
            <Image
              src={getProductImageUrl(img, "thumb")}
              alt=""
              width={80}
              height={80}
              unoptimized
              className="object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
