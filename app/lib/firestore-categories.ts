import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { CategoryModel } from "@/app/models/category";

export async function getCategories(): Promise<CategoryModel[]> {
  const snap = await getDocs(collection(db, "categories"));

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<CategoryModel, "id">),
  }));
}
