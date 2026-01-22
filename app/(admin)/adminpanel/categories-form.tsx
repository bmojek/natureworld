"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { CategoryModel } from "@/app/models/category";
import CategoryParentPicker from "@/app/components/CategoryParentPicker";
import { buildCategoryTree } from "@/app/lib/categories";
import { deleteDoc, doc } from "firebase/firestore";

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

export default function CategoriesForm() {
  const [categories, setCategories] = useState<CategoryModel[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    getDocs(collection(db, "categories")).then((snap) => {
      setCategories(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CategoryModel, "id">),
        })),
      );
    });
  }, []);
  const categoryTree = buildCategoryTree(categories);

  const submit = async () => {
    const parent = categories.find((c) => c.id === parentId) ?? null;

    await addDoc(collection(db, "categories"), {
      name,
      slug: slugify(name),
      parentId: parent ? parent.id : null,
      level: parent ? parent.level + 1 : 0,
    });

    setName("");
    setParentId(null);
    alert("Kategoria dodana ✅");
  };
  const deleteCategory = async (category: CategoryModel) => {
    const hasChildren = categories.some((c) => c.parentId === category.id);

    if (hasChildren) {
      alert("Nie możesz usunąć kategorii, która ma podkategorie.");
      return;
    }

    const ok = window.confirm(
      `Czy na pewno chcesz usunąć kategorię „${category.name}”?`,
    );

    if (!ok) return;

    await deleteDoc(doc(db, "categories", category.id));

    setCategories((prev) => prev.filter((c) => c.id !== category.id));

    if (parentId === category.id) {
      setParentId(null);
    }
  };

  return (
    <section className="max-w-xl space-y-6">
      <h2 className="text-xl font-semibold">Dodaj kategorię</h2>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nazwa kategorii"
        className="border p-3 w-full"
      />
      <button
        onClick={submit}
        disabled={!name}
        className="bg-primary text-white px-6 py-3 rounded-xl"
      >
        Dodaj kategorię
      </button>
      <div>
        <p className="font-medium mb-2">Rodzic kategorii</p>

        <div className="border rounded-xl p-4 bg-white">
          {parentId && (
            <p className="text-xs text-text-secondary m-2">
              Kategoria zostanie dodana jako podkategoria
            </p>
          )}
          <CategoryParentPicker
            tree={categoryTree}
            selectedParentId={parentId}
            onSelect={setParentId}
            onDelete={deleteCategory}
          />
        </div>
      </div>
    </section>
  );
}
