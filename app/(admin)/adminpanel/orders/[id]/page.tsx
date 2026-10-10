"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/auth-context";
import { canonicalOrderStatus, getAllowedNextOrderStatuses } from "@/app/lib/order-status-core";
import type { OrderFulfillmentStatus } from "@/app/models/order";

type OrderDetails = {
  id: string;
  orderNumber: string;
  createdAt: string | null;
  updatedAt: string | null;
  statusHistory: Array<{ previousStatus: string; newStatus: string; changedAt: string | null; adminUid: string }>;
  currency: string;
  items: Array<{ productId: string; name: string; sku: string; variant: string | null; quantity: number; unitPrice: number; lineTotal: number; image: string | null }>;
  productTotal: number;
  deliveryCost: number;
  discountTotal: number;
  total: number;
  customer: { fullName: string; email: string; phone: string; note: string; wantInvoice: boolean; nip: string | null };
  shippingAddress: { street: string; postalCode: string; city: string; countryCode: string };
  paymentMethod: string;
  deliveryMethod: string;
  paymentStatus: string;
  fulfillmentStatus: OrderFulfillmentStatus;
};

const statusLabels: Record<string, string> = {
  unpaid: "Nieopłacone", paid: "Opłacone", refunded: "Zwrócone",
  new: "Nowe", pending: "Nowe", processing: "W realizacji",
  ready_to_ship: "Gotowe do wysyłki", shipped: "Wysłane",
  completed: "Zakończone", delivered: "Zakończone", cancelled: "Anulowane",
};

function money(amount: number, currency: string) {
  return amount.toLocaleString("pl-PL", { style: "currency", currency: currency || "PLN" });
}

function dateLabel(value: string | null) {
  if (!value) return "Data niedostępna";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data niedostępna" : date.toLocaleString("pl-PL");
}

export default function AdminOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    setError("");
    setOrder(null);
    if (!user) {
      setError("Zaloguj się na konto administratora.");
      setLoading(false);
      return;
    }
    let active = true;
    void (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Nie udało się pobrać zamówienia.");
        if (active) {
          setOrder(data);
          setSelectedStatus(canonicalOrderStatus(data.fulfillmentStatus));
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Nie udało się pobrać zamówienia.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [authLoading, id, user]);

  async function saveStatus() {
    if (!order || !user || !selectedStatus || selectedStatus === canonicalOrderStatus(order.fulfillmentStatus)) return;
    const current = statusLabels[canonicalOrderStatus(order.fulfillmentStatus)];
    const next = statusLabels[selectedStatus];
    if (!window.confirm(`Czy zmienić status realizacji z „${current}” na „${next}”?`)) return;

    setSavingStatus(true);
    setStatusError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ expectedStatus: order.fulfillmentStatus, status: selectedStatus }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Nie udało się zmienić statusu.");
      setOrder(data);
      setSelectedStatus(canonicalOrderStatus(data.fulfillmentStatus));
    } catch (cause) {
      setStatusError(cause instanceof Error ? cause.message : "Nie udało się zmienić statusu.");
    } finally {
      setSavingStatus(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-5xl p-8">Ładowanie zamówienia…</main>;
  if (error || !order) return <main className="mx-auto max-w-5xl p-8"><Link href="/adminpanel/orders" className="text-primary hover:underline">← Zamówienia</Link><p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-red-800">{error || "Nie znaleziono zamówienia."}</p></main>;

  const currentStatus = canonicalOrderStatus(order.fulfillmentStatus);
  return (
    <main className="mx-auto max-w-5xl p-6 md:p-10">
      <Link href="/adminpanel/orders" className="text-sm text-primary hover:underline">← Zamówienia</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-3xl font-bold">{order.orderNumber}</h1><p className="mt-1 text-sm text-gray-500">{dateLabel(order.createdAt)}</p></div>
        <div className="rounded-lg bg-white px-4 py-3 text-sm shadow-sm"><div>Płatność: <strong>{statusLabels[order.paymentStatus] ?? order.paymentStatus}</strong></div><div className="mt-1">Realizacja: <strong>{statusLabels[currentStatus]}</strong></div></div>
      </div>

      <section className="mb-5 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Status realizacji</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium">Bieżący: {statusLabels[currentStatus]}</span>
          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} disabled={savingStatus} className="rounded-lg border px-3 py-2" aria-label="Nowy status realizacji">
            <option value={currentStatus}>{statusLabels[currentStatus]}</option>
            {getAllowedNextOrderStatuses(order.fulfillmentStatus).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
          </select>
          <button onClick={() => void saveStatus()} disabled={savingStatus || selectedStatus === currentStatus} className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50">
            {savingStatus ? "Zapisywanie…" : "Zmień status"}
          </button>
        </div>
        {order.updatedAt && <p className="mt-2 text-sm text-gray-500">Ostatnia aktualizacja: {dateLabel(order.updatedAt)}</p>}
        {statusError && <p role="alert" className="mt-3 text-sm text-red-700">{statusError}</p>}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Klient</h2>
          <p>{order.customer.fullName}</p><p>{order.customer.email}</p><p>{order.customer.phone}</p>
          {order.customer.note && <p className="mt-3 whitespace-pre-wrap"><strong>Uwagi:</strong> {order.customer.note}</p>}
          {order.customer.wantInvoice && <p className="mt-2"><strong>Faktura, NIP:</strong> {order.customer.nip || "nie podano"}</p>}
        </section>
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Dostawa i płatność</h2>
          <p>{order.shippingAddress.street}</p><p>{order.shippingAddress.postalCode} {order.shippingAddress.city}, {order.shippingAddress.countryCode}</p>
          <p className="mt-3"><strong>Dostawa:</strong> {order.deliveryMethod === "courier" ? "Kurier" : order.deliveryMethod}</p>
          <p><strong>Płatność:</strong> {order.paymentMethod === "cod" ? "Pobranie" : order.paymentMethod}</p>
        </section>
      </div>

      <section className="mt-5 overflow-hidden rounded-xl bg-white shadow-sm">
        <h2 className="border-b p-5 text-lg font-semibold">Pozycje zamówienia</h2>
        <div className="divide-y">
          {order.items.map((item, index) => <div key={`${item.productId}-${index}`} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div><p className="font-medium">{item.name}</p><p className="text-sm text-gray-500">SKU: {item.sku}{item.variant ? ` · ${item.variant}` : ""} · {item.quantity} szt. × {money(item.unitPrice, order.currency)}</p></div>
            <strong>{money(item.lineTotal, order.currency)}</strong>
          </div>)}
          {!order.items.length && <p className="p-5 text-gray-500">Brak zapisanych pozycji.</p>}
        </div>
        <div className="ml-auto max-w-sm space-y-2 border-t p-5 text-sm">
          <div className="flex justify-between"><span>Produkty</span><span>{money(order.productTotal, order.currency)}</span></div>
          <div className="flex justify-between"><span>Dostawa</span><span>{money(order.deliveryCost, order.currency)}</span></div>
          <div className="flex justify-between"><span>Rabat</span><span>−{money(order.discountTotal, order.currency)}</span></div>
          <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Razem</span><span>{money(order.total, order.currency)}</span></div>
        </div>
      </section>

      {order.statusHistory.length > 0 && <section className="mt-5 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Historia statusu</h2>
        <ol className="space-y-3">
          {order.statusHistory.map((entry, index) => <li key={`${entry.changedAt}-${index}`} className="border-l-2 border-primary pl-3 text-sm">
            <p><strong>{statusLabels[entry.previousStatus] ?? entry.previousStatus}</strong> → <strong>{statusLabels[entry.newStatus] ?? entry.newStatus}</strong></p>
            <p className="text-gray-500">{dateLabel(entry.changedAt)} · administrator UID: {entry.adminUid}</p>
          </li>)}
        </ol>
      </section>}
    </main>
  );
}
