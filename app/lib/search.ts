import { Product } from "@/app/models/product";

export async function searchProducts(query: string): Promise<Product[]> {
  if (!query) return [];

  try {
    const response = await fetch(
      `/api/products?search=${encodeURIComponent(query)}&suggestions=1`,
      { cache: "no-store" },
    );

    if (!response.ok) return [];

    const data = (await response.json()) as { products?: Product[] };
    return Array.isArray(data.products) ? data.products : [];
  } catch {
    return [];
  }
}
