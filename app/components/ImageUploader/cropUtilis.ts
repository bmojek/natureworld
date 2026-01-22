export async function getCroppedImage(src: string, crop: any): Promise<File> {
  const img = new Image();
  img.src = src;
  await new Promise((r) => (img.onload = r));

  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 800;

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 800, 800);

  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, 800, 800);

  return new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(new File([b!], "image.webp", { type: "image/webp" })),
      "image/webp",
      0.92,
    );
  });
}
