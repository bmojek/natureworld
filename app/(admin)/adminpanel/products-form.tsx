"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { CategoryModel } from "@/app/models/category";
import { buildCategoryTree } from "@/app/lib/categories";
import CategoryTreePicker from "@/app/components/CategoryTreePicker";
import ImageUploader from "@/app/components/ImageUploader/ImageUploader";
import { PreparedImage } from "@/app/components/ImageUploader/types";
import { uploadImagesToR2 } from "@/app/lib/upload-images";
/* ================= HELPERS ================= */

function slugify(text: string) {
  const map: Record<string, string> = {
    ą: "a",
    ć: "c",
    ę: "e",
    ł: "l",
    ń: "n",
    ó: "o",
    ś: "s",
    ż: "z",
    ź: "z",
  };

  return text
    .toLowerCase()
    .trim()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* ================= COMPONENT ================= */

export default function ProductsForm() {
  /* ===== IMAGES ===== */
  const [images, setImages] = useState<PreparedImage[]>([]);

  /* ===== CATEGORIES ===== */
  const [categories, setCategories] = useState<CategoryModel[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  /* ===== BASIC ===== */
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");

  /* ===== ATTRIBUTES ===== */
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [lengthCm, setLengthCm] = useState<number | "">("");
  const [widthCm, setWidthCm] = useState<number | "">("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [material, setMaterial] = useState("");
  const [flavor, setFlavor] = useState("");
  const [ageGroup, setAgeGroup] = useState("");

  /* ===== NUTRITION ===== */
  const [protein, setProtein] = useState<number | "">("");
  const [fat, setFat] = useState<number | "">("");
  const [fiber, setFiber] = useState<number | "">("");
  const [ash, setAsh] = useState<number | "">("");
  const [moisture, setMoisture] = useState<number | "">("");
  const productSlug = name ? slugify(name) : "";
  /* ===== META ===== */
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH CATEGORIES ================= */

  useEffect(() => {
    getDocs(collection(db, "categories")).then((snap) => {
      setCategories(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<CategoryModel, "id">),
        })),
      );
    });
  }, []);

  const categoryTree = buildCategoryTree(categories);

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  /* ================= SUBMIT ================= */

  const submit = async () => {
    if (!name || price === "" || categoryIds.length === 0) {
      alert("Uzupełnij nazwę, cenę i wybierz kategorię");
      return;
    }

    setLoading(true);
    const uploadedImages = await uploadImagesToR2(images);
    console.log("Uploaded images:", uploadedImages);
    await addDoc(collection(db, "products"), {
      name,
      slug: slugify(name),
      shortDescription,
      description,

      price: Number(price),
      stock: Number(stock) || 0,
      categoryIds,

      // ⬇️ NA RAZIE SAME NAZWY – upload później
      images: images.map((img, index) => productSlug + `_${index}`),

      isActive: active,

      attributes: {
        ...(weightKg !== "" && { weightKg }),
        ...(lengthCm !== "" && { lengthCm }),
        ...(widthCm !== "" && { widthCm }),
        ...(heightCm !== "" && { heightCm }),
        ...(material && { material }),
        ...(flavor && { flavor }),
        ...(ageGroup && { ageGroup }),
      },

      nutrition: {
        ...(protein !== "" && { protein }),
        ...(fat !== "" && { fat }),
        ...(fiber !== "" && { fiber }),
        ...(ash !== "" && { ash }),
        ...(moisture !== "" && { moisture }),
      },

      createdAt: serverTimestamp(),
    });

    setLoading(false);
    alert("Produkt dodany ✅");
  };

  /* ================= UI ================= */

  return (
    <section className="max-w-4xl space-y-12">
      <h2 className="text-2xl font-semibold">Dodaj produkt</h2>

      {/* ===== IMAGES ===== */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Zdjęcia produktu</h3>
        {productSlug ? (
          <ImageUploader productSlug={productSlug} onChange={setImages} />
        ) : (
          <div className="border border-dashed rounded-xl p-6 text-sm text-text-secondary bg-gray-50">
            Najpierw wpisz <strong>nazwę produktu</strong>, aby dodać zdjęcia.
          </div>
        )}
      </div>

      {/* ===== BASIC ===== */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Podstawowe informacje</h3>

        <label className="block">
          <span className="text-sm">Nazwa produktu</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`border p-3 w-full ${images.length !== 0 ? "bg-gray-200 cursor-not-allowed" : ""}`}
            disabled={images.length !== 0}
          />
        </label>

        <label className="block">
          <span className="text-sm">Krótki opis</span>
          <input
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            className="border p-3 w-full"
          />
        </label>

        <label className="block">
          <span className="text-sm">Pełny opis</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="border p-3 w-full"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className="text-sm">Cena (zł)</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="border p-3 w-full"
            />
          </label>

          <label>
            <span className="text-sm">Stan magazynowy</span>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="border p-3 w-full"
            />
          </label>
        </div>
      </div>

      {/* ===== ATTRIBUTES ===== */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Atrybuty produktu</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="number"
            placeholder="Waga (kg)"
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
            className="border p-3"
          />
          <input
            type="number"
            placeholder="Długość (cm)"
            value={lengthCm}
            onChange={(e) => setLengthCm(Number(e.target.value))}
            className="border p-3"
          />
          <input
            type="number"
            placeholder="Szerokość (cm)"
            value={widthCm}
            onChange={(e) => setWidthCm(Number(e.target.value))}
            className="border p-3"
          />
          <input
            type="number"
            placeholder="Wysokość (cm)"
            value={heightCm}
            onChange={(e) => setHeightCm(Number(e.target.value))}
            className="border p-3"
          />
          <input
            placeholder="Materiał"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="border p-3"
          />
          <input
            placeholder="Smak"
            value={flavor}
            onChange={(e) => setFlavor(e.target.value)}
            className="border p-3"
          />
          <input
            placeholder="Grupa wiekowa"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="border p-3 md:col-span-3"
          />
        </div>
      </div>

      {/* ===== NUTRITION ===== */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Wartości odżywcze</h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <input
            type="number"
            placeholder="Białko %"
            value={protein}
            onChange={(e) => setProtein(Number(e.target.value))}
            className="border p-3"
          />
          <input
            type="number"
            placeholder="Tłuszcz %"
            value={fat}
            onChange={(e) => setFat(Number(e.target.value))}
            className="border p-3"
          />
          <input
            type="number"
            placeholder="Błonnik %"
            value={fiber}
            onChange={(e) => setFiber(Number(e.target.value))}
            className="border p-3"
          />
          <input
            type="number"
            placeholder="Popiół %"
            value={ash}
            onChange={(e) => setAsh(Number(e.target.value))}
            className="border p-3"
          />
          <input
            type="number"
            placeholder="Wilgotność %"
            value={moisture}
            onChange={(e) => setMoisture(Number(e.target.value))}
            className="border p-3"
          />
        </div>
      </div>

      {/* ===== CATEGORIES ===== */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Kategorie</h3>
        <div className="border rounded-xl p-4 bg-white">
          <CategoryTreePicker
            tree={categoryTree}
            selected={categoryIds}
            onToggle={toggleCategory}
          />
        </div>
      </div>

      {/* ===== ACTIVE ===== */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={() => setActive(!active)}
        />
        Produkt aktywny
      </label>

      {/* ===== SUBMIT ===== */}
      <button
        onClick={submit}
        disabled={loading}
        className="bg-primary text-white px-8 py-4 rounded-xl disabled:opacity-50"
      >
        {loading ? "Zapisywanie..." : "Dodaj produkt"}
      </button>
    </section>
  );
}
