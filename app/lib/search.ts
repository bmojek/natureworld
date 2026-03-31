import Fuse from "fuse.js";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

let cache: any[] = [];
let fuse: Fuse<any> | null = null;

export async function searchProducts(query: string) {
  if (!query) return [];

  // 🔥 cache produktów (ważne)
  if (cache.length === 0) {
    const snap = await getDocs(collection(db, "products"));

    cache = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    fuse = new Fuse(cache, {
      keys: ["name"],
      threshold: 0.3, // im niżej tym dokładniej
      ignoreLocation: true,
    });
  }

  if (!fuse) return [];

  const results = fuse.search(query);

  return results.slice(0, 10).map((r) => r.item);
}
