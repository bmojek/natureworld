import { CategoryModel } from "@/app/models/category";

export async function getCategories(): Promise<CategoryModel[]> {
  const res = await fetch("/api/categories", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  return res.json();
}
