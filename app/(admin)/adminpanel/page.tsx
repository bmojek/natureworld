"use client";

import { useState } from "react";
import Link from "next/link";
import CategoriesForm from "./categories-form";
import PostsForm from "./posts-form";
import { useAuth } from "@/app/context/auth-context";

type Tab = "categories" | "posts";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("categories");
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

      <Link href="/adminpanel/orders" className="mb-8 inline-flex rounded-lg bg-primary px-5 py-3 font-medium text-white hover:opacity-90">
        Obsługa zamówień
      </Link>

      {/* ZAKŁADKI */}
      <div className="flex gap-4 border-b mb-8">
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
        <button
          onClick={() => setTab("posts")}
          className={`pb-2 font-medium ${
            tab === "posts"
              ? "border-b-2 border-primary text-primary"
              : "text-text-secondary"
          }`}
        >
          Posty
        </button>
      </div>

      {/* CONTENT */}
      {tab === "categories" && <CategoriesForm />}
      {tab === "posts" && <PostsForm />}
    </main>
  );
}
