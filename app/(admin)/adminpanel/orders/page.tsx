"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/context/auth-context";

const PAGE_SIZE = 25;

type OrderSummary = {
  id: string;
  orderNumber: string;
  createdAt: string | null;
  customerName: string;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
};

const statusLabels: Record<string, string> = {
  new: "Nowe", pending: "Nowe",
  unpaid: "Nieopłacone", paid: "Opłacone", refunded: "Zwrócone",
  processing: "W realizacji", ready_to_ship: "Gotowe do wysyłki", shipped: "Wysłane",
  completed: "Zakończone", delivered: "Zakończone (starsze)", cancelled: "Anulowane",
};

function dateLabel(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pl-PL");
}

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [number, setNumber] = useState("");
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({ status });
      if (number) params.set("number", number);
      const cursor = cursorStack.at(-1);
      if (cursor) params.set("cursor", cursor);
      const response = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Nie udało się pobrać zamówień.");
      setOrders(data.orders);
      setNextCursor(data.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nie udało się pobrać zamówień.");
      setOrders([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, [user, status, number, cursorStack]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("Zaloguj się na konto administratora.");
      setOrders([]);
      return;
    }
    void loadOrders();
  }, [authLoading, loadOrders, user]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCursorStack([]);
    setNumber(searchInput.trim());
  }

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/adminpanel" className="text-sm text-primary hover:underline">← Panel admina</Link>
          <h1 className="mt-2 text-3xl font-bold">Zamówienia</h1>
        </div>
        <button onClick={() => void loadOrders()} disabled={loading || !user} className="rounded-lg border px-4 py-2 hover:bg-white disabled:opacity-50">
          Odśwież
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm">
        <form onSubmit={submitSearch} className="flex flex-1 flex-wrap gap-2">
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Numer, np. NW-0000001" className="min-w-64 flex-1 rounded-lg border px-3 py-2" />
          <button className="rounded-lg bg-primary px-4 py-2 text-white">Szukaj</button>
          {number && <button type="button" onClick={() => { setSearchInput(""); setNumber(""); setCursorStack([]); }} className="rounded-lg border px-4 py-2">Wyczyść</button>}
        </form>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setCursorStack([]); }} className="rounded-lg border px-3 py-2" aria-label="Filtr statusu">
          <option value="all">Wszystkie statusy</option>
          <optgroup label="Płatność">
            <option value="unpaid">Nieopłacone</option><option value="paid">Opłacone</option><option value="refunded">Zwrócone</option>
          </optgroup>
          <optgroup label="Realizacja">
            <option value="new">Nowe</option><option value="pending">Nowe (starsze zamówienia)</option><option value="processing">W realizacji</option><option value="ready_to_ship">Gotowe do wysyłki</option><option value="shipped">Wysłane</option><option value="completed">Zakończone</option><option value="delivered">Zakończone (starsze zamówienia)</option><option value="cancelled">Anulowane</option>
          </optgroup>
        </select>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
      {authLoading || loading ? <p className="py-10 text-center">Ładowanie zamówień…</p> : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr><th className="p-4">Numer / data</th><th className="p-4">Klient</th><th className="p-4">Kwota</th><th className="p-4">Płatność</th><th className="p-4">Status płatności</th><th className="p-4">Realizacja</th></tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => <tr key={order.id} className="hover:bg-gray-50">
                <td className="p-4"><Link className="font-semibold text-primary hover:underline" href={`/adminpanel/orders/${order.id}`}>{order.orderNumber || "Zamówienie"}</Link><div className="mt-1 text-xs text-gray-500">{dateLabel(order.createdAt)}</div></td>
                <td className="p-4">{order.customerName || "—"}</td>
                <td className="p-4 font-medium">{order.total.toLocaleString("pl-PL", { style: "currency", currency: order.currency || "PLN" })}</td>
                <td className="p-4">{order.paymentMethod === "cod" ? "Pobranie" : order.paymentMethod || "—"}</td>
                <td className="p-4">{statusLabels[order.paymentStatus] ?? (order.paymentStatus || "—")}</td>
                <td className="p-4">{statusLabels[order.fulfillmentStatus] ?? (order.fulfillmentStatus || "—")}</td>
              </tr>)}
              {!orders.length && <tr><td colSpan={6} className="p-10 text-center text-gray-500">Brak zamówień dla wybranych kryteriów.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">Maksymalnie {PAGE_SIZE} zamówień na stronę</span>
        <div className="flex gap-2">
          <button disabled={cursorStack.length === 0 || loading} onClick={() => setCursorStack((stack) => stack.slice(0, -1))} className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40">Poprzednia</button>
          <button disabled={!nextCursor || loading || !!number} onClick={() => nextCursor && setCursorStack((stack) => [...stack, nextCursor])} className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40">Następna</button>
        </div>
      </div>
    </main>
  );
}
