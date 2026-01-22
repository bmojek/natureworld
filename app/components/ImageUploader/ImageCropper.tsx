"use client";

import Cropper from "react-easy-crop";
import { useCallback, useState } from "react";

type Props = {
  image: string;
  onConfirm: (main: Blob, thumb: Blob) => void;
  onCancel: () => void;
};

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function cropToCanvas(
  imageSrc: string,
  crop: any,
  size: number,
): Promise<Blob> {
  const img = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);

  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);

  return new Promise((res) =>
    canvas.toBlob((b) => res(b!), "image/webp", 0.92),
  );
}

export default function ImageCropper({ image, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.5);
  const [area, setArea] = useState<any>(null);

  const confirm = useCallback(async () => {
    const main = await cropToCanvas(image, area, 800);
    const thumb = await cropToCanvas(image, area, 400);
    onConfirm(main, thumb);
  }, [image, area]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white w-105 rounded-xl p-4 space-y-4">
        <div className="relative w-full h-75 bg-white">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            minZoom={0.2}
            aspect={1}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, a) => setArea(a)}
          />
        </div>

        <input
          type="range"
          min={0.2}
          max={2}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm">
            Anuluj
          </button>
          <button
            onClick={confirm}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
}
