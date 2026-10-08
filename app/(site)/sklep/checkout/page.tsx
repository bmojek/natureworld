"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, ShoppingBag } from "lucide-react";
import { useCart } from "@/app/context/cart-context";

type CheckoutResponse = {
  orderId?: number;
  total?: number;
  error?: string;
  safeToRetry?: boolean;
};

const idempotencyStorageKey = "natureworld-checkout-request";

function getIdempotencyKey(keyRef: { current: string | null }) {
  if (keyRef.current) return keyRef.current;

  const saved = sessionStorage.getItem(idempotencyStorageKey);
  if (saved) {
    keyRef.current = saved;
    return saved;
  }

  const created = crypto.randomUUID();
  keyRef.current = created;
  sessionStorage.setItem(idempotencyStorageKey, created);
  return created;
}

function clearIdempotencyKey(keyRef: { current: string | null }) {
  keyRef.current = null;
  sessionStorage.removeItem(idempotencyStorageKey);
}

export default function CheckoutPage() {
  const { items, ready, total, clearCart } = useCart();
  const [wantInvoice, setWantInvoice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<{ id: number; total: number } | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const estimatedDelivery = total >= 99 ? 0 : 15;
  const estimatedGrandTotal = total + estimatedDelivery;

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || items.length === 0) return;

    const formData = new FormData(event.currentTarget);
    const customer = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      street: String(formData.get("street") ?? ""),
      postalCode: String(formData.get("postalCode") ?? ""),
      city: String(formData.get("city") ?? ""),
      note: String(formData.get("note") ?? ""),
      wantInvoice,
      nip: String(formData.get("nip") ?? ""),
    };

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: getIdempotencyKey(idempotencyKey),
          items: items.map(({ productId, qty }) => ({ productId, qty })),
          customer,
          termsAccepted: formData.get("terms") === "on",
          website: String(formData.get("website") ?? ""),
        }),
      });
      const result = (await response.json()) as CheckoutResponse;

      if (response.status === 202) {
        setPending(true);
        setError("Base nadal potwierdza status zamówienia. Użyj przycisku poniżej, aby sprawdzić ponownie.");
        return;
      }

      if (!response.ok || !result.orderId) {
        if (result.safeToRetry) {
          clearIdempotencyKey(idempotencyKey);
          setPending(false);
        }
        setError(
          result.error === "INSUFFICIENT_STOCK"
            ? "Stan produktu zmienił się. Wróć do koszyka i sprawdź jego zawartość."
            : result.error === "PRODUCT_UNAVAILABLE"
              ? "Jeden z produktów nie jest już dostępny. Wróć do koszyka."
              : result.error === "BASE_STATUS_NOT_CONFIGURED"
                ? "Base nie ma skonfigurowanego statusu zamówienia. Skontaktuj się ze sklepem."
                : "Nie udało się złożyć zamówienia. Sprawdź dane i spróbuj ponownie.",
        );
        return;
      }

      setOrder({ id: result.orderId, total: result.total ?? estimatedGrandTotal });
      setPending(false);
      clearIdempotencyKey(idempotencyKey);
      clearCart();
    } catch {
      setPending(true);
      setError("Nie udało się potwierdzić odpowiedzi Base. Sprawdź status ponownie, aby nie utworzyć duplikatu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function checkOrderStatus() {
    const key = getIdempotencyKey(idempotencyKey);
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/checkout?key=${encodeURIComponent(key)}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as CheckoutResponse & { state?: string };

      if (response.ok && result.state === "succeeded" && result.orderId) {
        setOrder({ id: result.orderId, total: result.total ?? estimatedGrandTotal });
        clearIdempotencyKey(idempotencyKey);
        clearCart();
      } else if (response.status === 202) {
        setError("Base nadal przetwarza zamówienie. Sprawdź ponownie za kilka sekund.");
      } else if (result.safeToRetry) {
        clearIdempotencyKey(idempotencyKey);
        setPending(false);
        setError("Poprzednia próba nie utworzyła zamówienia. Możesz spróbować ponownie.");
      } else {
        setError("Nie udało się odczytać statusu. Skontaktuj się ze sklepem przed ponownym złożeniem zamówienia.");
      }
    } catch {
      setError("Nie udało się odczytać statusu. Spróbuj ponownie.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">Ładowanie koszyka…</main>;
  }

  if (order) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-3xl px-6 py-16">
        <div className="border-t-4 border-primary py-8">
          <CheckCircle2 className="mb-5 text-primary" size={36} />
          <p className="text-sm font-semibold uppercase text-primary">Zamówienie przyjęte</p>
          <h1 className="mt-2 text-3xl font-semibold">Dziękujemy za zakupy</h1>
          <p className="mt-4 text-text-secondary">
            Numer zamówienia Base: <strong>{order.id}</strong>
          </p>
          <p className="mt-2 text-text-secondary">
            Do zapłaty przy odbiorze: <strong>{order.total.toFixed(2)} zł</strong>
          </p>
          <Link href="/sklep" className="mt-8 inline-flex items-center gap-2 font-semibold text-primary">
            <ShoppingBag size={18} /> Wróć do sklepu
          </Link>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-4xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">Koszyk jest pusty</h1>
        <Link href="/sklep" className="mt-5 inline-flex items-center gap-2 text-primary">
          <ArrowLeft size={17} /> Wróć do sklepu
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1fr_360px]">
      <section>
        <Link href="/sklep/koszyk" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary">
          <ArrowLeft size={16} /> Wróć do koszyka
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase text-primary">Finalizacja</p>
        <h1 className="mt-1 text-3xl font-semibold">Dane do dostawy</h1>
        <p className="mt-3 max-w-2xl text-sm text-text-secondary">
          Dostępna płatność: za pobraniem. Ceny i dostępność potwierdzimy ponownie w magazynie Base przy składaniu zamówienia.
        </p>

        <form onSubmit={submitOrder} className="mt-8 space-y-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Imię i nazwisko</span>
              <input name="fullName" autoComplete="name" required maxLength={120} className="w-full border border-black/20 bg-white px-3 py-3 outline-none focus:border-primary" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">E-mail</span>
              <input name="email" type="email" autoComplete="email" required maxLength={150} className="w-full border border-black/20 bg-white px-3 py-3 outline-none focus:border-primary" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Telefon</span>
              <input name="phone" type="tel" autoComplete="tel" required maxLength={40} className="w-full border border-black/20 bg-white px-3 py-3 outline-none focus:border-primary" />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Ulica i numer</span>
              <input name="street" autoComplete="street-address" required maxLength={150} className="w-full border border-black/20 bg-white px-3 py-3 outline-none focus:border-primary" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Kod pocztowy</span>
              <input name="postalCode" autoComplete="postal-code" required maxLength={20} className="w-full border border-black/20 bg-white px-3 py-3 outline-none focus:border-primary" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Miejscowość</span>
              <input name="city" autoComplete="address-level2" required maxLength={100} className="w-full border border-black/20 bg-white px-3 py-3 outline-none focus:border-primary" />
            </label>
          </div>

          <label className="flex items-center gap-3 border-y border-black/10 py-4">
            <input type="checkbox" checked={wantInvoice} onChange={(event) => setWantInvoice(event.target.checked)} className="size-4 accent-primary" />
            <span className="text-sm font-medium">Chcę otrzymać fakturę</span>
          </label>

          {wantInvoice && (
            <label className="block max-w-sm space-y-2">
              <span className="text-sm font-medium">NIP</span>
              <input name="nip" inputMode="numeric" pattern="[0-9\s-]{10,20}" required maxLength={20} className="w-full border border-black/20 bg-white px-3 py-3 outline-none focus:border-primary" />
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium">Uwagi do zamówienia (opcjonalnie)</span>
            <textarea name="note" rows={3} maxLength={500} className="w-full resize-y border border-black/20 bg-white px-3 py-3 outline-none focus:border-primary" />
          </label>

          <label className="hidden" aria-hidden="true">
            Strona internetowa <input name="website" tabIndex={-1} autoComplete="off" />
          </label>

          <label className="flex items-start gap-3 text-sm leading-6">
            <input name="terms" type="checkbox" required className="mt-1 size-4 accent-primary" />
            <span>Potwierdzam poprawność danych i akceptuję regulamin sklepu.</span>
          </label>

          {error && (
            <div role="alert" className="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950">
              {error}
            </div>
          )}

          <button type={pending ? "button" : "submit"} onClick={pending ? checkOrderStatus : undefined} disabled={submitting} className="inline-flex min-h-12 items-center justify-center gap-2 bg-primary px-7 py-3 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60">
            {submitting && <LoaderCircle className="animate-spin" size={18} />}
            {pending ? "Sprawdź status zamówienia" : submitting ? "Wysyłanie…" : "Złóż zamówienie za pobraniem"}
          </button>
        </form>
      </section>

      <aside className="h-fit border-t-4 border-primary bg-bg-muted p-6 lg:sticky lg:top-8">
        <h2 className="text-lg font-semibold">Podsumowanie</h2>
        <ul className="mt-5 divide-y divide-black/10">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-4 py-3 text-sm">
              <span>{item.name} <span className="text-text-secondary">× {item.qty}</span></span>
              <span className="shrink-0 font-medium">{(item.price * item.qty).toFixed(2)} zł</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2 border-t border-black/10 pt-4 text-sm">
          <div className="flex justify-between"><span>Produkty (orientacyjnie)</span><span>{total.toFixed(2)} zł</span></div>
          <div className="flex justify-between"><span>Dostawa</span><span>{estimatedDelivery ? `${estimatedDelivery.toFixed(2)} zł` : "Gratis"}</span></div>
          <div className="flex justify-between border-t border-black/10 pt-3 text-base font-semibold"><span>Szacunkowa suma</span><span>{estimatedGrandTotal.toFixed(2)} zł</span></div>
        </div>
        <p className="mt-4 text-xs leading-5 text-text-secondary">Ostateczna cena zostanie obliczona z aktualnych cen w Base.</p>
      </aside>
    </main>
  );
}