"use client";

import { useState } from "react";
import ProductsForm from "./products-form";
import CategoriesForm from "./categories-form";
import { useAuth } from "@/app/context/auth-context";

type Tab = "products" | "categories";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("products");
  const { user } = useAuth();
  const adminAccounts =
    process.env.NEXT_PUBLIC_ADMINACCOUNTS?.split(",").map((e) => e.trim()) ??
    [];
  const isAdmin = adminAccounts.includes(user?.email ?? "");
  if (!isAdmin) {
    return <div className="max-w-6xl mx-auto p-10">Access Denied</div>;
  }
  return (
    <main className="max-w-6xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-8">Panel admina</h1>

      {/* ZAKŁADKI */}
      <div className="flex gap-4 border-b mb-8">
        <button
          onClick={() => setTab("products")}
          className={`pb-2 font-medium ${
            tab === "products"
              ? "border-b-2 border-primary text-primary"
              : "text-text-secondary"
          }`}
        >
          Produkty
        </button>

        <button
          onClick={() => setTab("categories")}
          className={`pb-2 font-medium ${
            tab === "categories"
              ? "border-b-2 border-primary text-primary"
              : "text-text-secondary"
          }`}
        >
          Kategorie
        </button>
      </div>

      {/* CONTENT */}
      {tab === "products" && <ProductsForm />}
      {tab === "categories" && <CategoriesForm />}
    </main>
  );
}
