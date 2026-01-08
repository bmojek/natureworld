import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { ProductModel } from "@/app/models/product";

export async function getProductsByCategoryIds(
  categoryIds: string[]
): Promise<ProductModel[]> {
  if (categoryIds.length === 0) return [];

  const q = query(
    collection(db, "products"),
    where("categoryIds", "array-contains-any", categoryIds.slice(0, 10))
  );

  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ProductModel, "id">),
  }));
}
