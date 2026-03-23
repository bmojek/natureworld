import { PostImage } from "@/app/components/ImageUploader/post-types";

export async function uploadPostImagesToR2(
  images: PostImage[],
): Promise<string[]> {
  const formData = new FormData();

  images.forEach((img) => {
    formData.append("files", img.file);
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
