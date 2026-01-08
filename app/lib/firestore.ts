import { db } from "./firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

import { ProductModel } from "@/app/models/product";
import { CategoryModel } from "@/app/models/category";

export async function getProducts(): Promise<ProductModel[]> {
  const q = query(collection(db, "products"), where("isActive", "==", true));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ProductModel[];
}
export async function getProductBySlug(
  slug: string
): Promise<ProductModel | null> {
  const q = query(
    collection(db, "products"),
    where("slug", "==", slug),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as ProductModel;
}
export async function getProductsByCategory(
  categoryId: string
): Promise<ProductModel[]> {
  const q = query(
    collection(db, "products"),
    where("categoryIds", "array-contains", categoryId),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ProductModel[];
}
export async function getCategories(): Promise<CategoryModel[]> {
  const snapshot = await getDocs(collection(db, "categories"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CategoryModel[];
}
