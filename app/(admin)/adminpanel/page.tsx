"use client";

import Link from "next/link";
import PostsForm from "./posts-form";
import { useAuth } from "@/app/context/auth-context";

export default function AdminPage() {
  const { user } = useAuth();
  const adminAccounts =
    process.env.NEXT_PUBLIC_ADMINACCOUNTS?.split(",").map((email) => email.trim()) ?? [];
  const isAdmin = adminAccounts.includes(user?.email ?? "");

  if (!isAdmin) {
    return <div className="mx-auto max-w-6xl p-10">Brak dostępu</div>;
  }

  return (
    <main className="mx-auto max-w-6xl p-6 md:p-10">
      <h1 className="mb-6 text-3xl font-bold">Panel administratora</h1>
      <Link href="/adminpanel/orders" className="inline-flex rounded-lg bg-primary px-5 py-3 font-medium text-white hover:opacity-90">
        Obsługa zamówień
      </Link>
      <section aria-label="Zarządzanie postami" className="mt-10">
        <h2 className="mb-6 text-2xl font-semibold">Posty</h2>
        <PostsForm />
      </section>
    </main>
  );
}
