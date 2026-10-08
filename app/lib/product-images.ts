export function getProductImageUrl(
  image: string | undefined,
  size: "main" | "thumb",
) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;

  return `/api/image/${image}_${size}.webp`;
}