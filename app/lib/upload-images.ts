import { PreparedImage } from "@/app/components/ImageUploader/types";

export async function uploadImagesToR2(
  images: PreparedImage[],
): Promise<string[]> {
  const formData = new FormData();

  images.forEach((img) => {
    formData.append("files", img.main);
    formData.append("files", img.thumb);
  });

  const res = await fetch("/api/upload-images", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  return data.files as string[];
}
