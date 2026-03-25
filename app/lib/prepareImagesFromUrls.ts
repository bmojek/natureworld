"use client";

import { PreparedImage } from "@/app/components/ImageUploader/types";

async function resizeToWebp(
  img: HTMLImageElement,
  size: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");

  const ratio = img.width / img.height;

  let w = size;
  let h = size;

  if (ratio > 1) {
    h = size / ratio;
  } else {
    w = size * ratio;
  }

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(img, 0, 0, w, h);

  return await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/webp", 0.9),
  );
}

async function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.src = url;
  });
}

export async function prepareImagesFromUrls(
  urls: string[],
  slug: string,
): Promise<PreparedImage[]> {
  const result: PreparedImage[] = [];

  for (let i = 0; i < urls.length; i++) {
    const img = await loadImage(urls[i]);

    const mainBlob = await resizeToWebp(img, 1200);

    const thumbBlob = await resizeToWebp(img, 400);

    const main = new File([mainBlob], `${slug}_${i}_main.webp`, {
      type: "image/webp",
    });

    const thumb = new File([thumbBlob], `${slug}_${i}_thumb.webp`, {
      type: "image/webp",
    });

    result.push({
      id: crypto.randomUUID(),
      main,
      thumb,
      previewUrl: URL.createObjectURL(mainBlob),
    });
  }

  return result;
}
