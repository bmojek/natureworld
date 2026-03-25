"use client";

import { useState } from "react";

function Tree({ data }: { data: any }) {
  return (
    <ul className="pl-4 border-l">
      {Object.keys(data).map((key) => (
        <li key={key}>
          <div>{key}</div>

          {Object.keys(data[key]).length > 0 && <Tree data={data[key]} />}
        </li>
      ))}
    </ul>
  );
}

export default function ImportPage() {
  const [tree, setTree] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  /* ================= PREVIEW ================= */

  const upload = async (f: File) => {
    setFile(f);

    const form1 = new FormData();
    form1.append("file", f);

    const res1 = await fetch("/api/import-categories-preview", {
      method: "POST",
      body: form1,
    });

    const data1 = await res1.json();

    setTree(data1.tree);

    const form2 = new FormData();
    form2.append("file", f);

    const res2 = await fetch("/api/import-products-preview", {
      method: "POST",
      body: form2,
    });

    const data2 = await res2.json();

    setProducts(data2.products || []);
  };

  /* ================= SAVE CATEGORIES ================= */

  const saveCategories = async () => {
    await fetch("/api/import-categories-save", {
      method: "POST",
      body: JSON.stringify({
        tree,
      }),
    });

    alert("Kategorie zapisane");
  };

  /* ================= SAVE PRODUCTS ================= */

  const saveProducts = async () => {
    if (!file) return;

    setLoading(true);

    const form = new FormData();
    form.append("file", file);

    await fetch("/api/import-products-save", {
      method: "POST",
      body: form,
    });

    setLoading(false);

    alert("Produkty zapisane");
  };

  return (
    <div className="p-10 space-y-6">
      <h1 className="text-xl font-bold">Import Allegro</h1>

      <input
        type="file"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            upload(e.target.files[0]);
          }
        }}
      />

      {tree && (
        <div className="flex gap-4">
          <button
            onClick={saveCategories}
            className="bg-black text-white px-4 py-2"
          >
            ZAPISZ KATEGORIE
          </button>

          <button
            onClick={saveProducts}
            className="bg-green-600 text-white px-4 py-2"
          >
            {loading ? "Import..." : "IMPORT PRODUKTY"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-10">
        {/* TREE */}

        <div>
          <h2 className="font-bold mb-4">Kategorie</h2>

          {tree && <Tree data={tree} />}
        </div>

        {/* PRODUCTS */}

        <div>
          <h2 className="font-bold mb-4">
            Produkty preview ({products.length})
          </h2>

          <div className="space-y-6 max-h-150 overflow-auto">
            {products.map((p, i) => (
              <div key={i} className="border p-4 space-y-2">
                <div>
                  <b>{p.name}</b>
                </div>

                <div>Cena: {p.price}</div>

                <div>Stock: {p.stock}</div>

                <div>SKU: {p.sku}</div>

                <div>Allegro: {p.allegroId}</div>

                <div>Category: {p.category}</div>

                <div className="flex gap-2">
                  {p.images.map((img: string) => (
                    <img
                      key={img}
                      src={img}
                      className="w-16 h-16 object-cover"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
