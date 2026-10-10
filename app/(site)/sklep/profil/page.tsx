"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/auth-context";
import { auth } from "@/app/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, reload, sendEmailVerification, sendPasswordResetEmail, updatePassword } from "firebase/auth";
import Link from "next/link";
import { ArrowRight, KeyRound, LoaderCircle, MailCheck, Package, RefreshCw, UserRound } from "lucide-react";

type AccountOrder = {
  id: string;
  orderNumber: string;
  createdAt: string | null;
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
  productTotal: number;
  deliveryCost: number;
  discountTotal: number;
  total: number;
  paymentMethod: string;
  deliveryMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
};

const fulfillmentLabels: Record<string, string> = {
  new: "Nowe", pending: "Oczekujące", processing: "W realizacji", ready_to_ship: "Gotowe do wysyłki",
  shipped: "Wysłane", completed: "Zakończone", delivered: "Dostarczone", cancelled: "Anulowane",
};
const paymentLabels: Record<string, string> = { unpaid: "Nieopłacone", paid: "Opłacone", refunded: "Zwrócone" };

function formatPrice(value: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);
}

function KontoContent() {
  const { user, logout } = useAuth();
  const [verified, setVerified] = useState(user?.emailVerified ?? false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const loadOrders = useCallback(async (cursor?: string) => {
    if (!user || !verified) return;
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const token = await user.getIdToken();
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
      const response = await fetch(`/api/account/orders${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Nie udało się pobrać zamówień.");
      setOrders((existing) => cursor ? [...existing, ...payload.orders] : payload.orders);
      setNextCursor(payload.nextCursor ?? null);
    } catch (cause) {
      setOrdersError(cause instanceof Error ? cause.message : "Nie udało się pobrać zamówień.");
    } finally {
      setOrdersLoading(false);
    }
  }, [user, verified]);

  useEffect(() => {
    if (verified) void loadOrders();
  }, [verified, loadOrders]);

  async function refreshVerification() {
    if (!user) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await reload(user);
      await user.getIdToken(true);
      setVerified(user.emailVerified);
      setNotice(user.emailVerified ? "Adres e-mail jest zweryfikowany." : "Weryfikacja nie została jeszcze potwierdzona. Otwórz link z wiadomości i spróbuj ponownie.");
    } catch {
      setError("Nie udało się odświeżyć statusu weryfikacji.");
    } finally { setBusy(false); }
  }

  async function sendVerification() {
    if (!user) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await sendEmailVerification(user);
      setNotice("Wysłaliśmy link weryfikacyjny na adres e-mail przypisany do konta.");
    } catch {
      setError("Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.");
    } finally { setBusy(false); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setNotice("");
    if (!user?.email) return;
    if (newPassword.length < 6 || newPassword.length > 70) { setError("Nowe hasło musi mieć od 6 do 70 znaków."); return; }
    if (newPassword !== confirmPassword) { setError("Nowe hasła nie są takie same."); return; }
    setBusy(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setNotice("Hasło zostało zmienione.");
    } catch (cause) {
      const code = (cause as { code?: string })?.code;
      setError(code === "auth/wrong-password" || code === "auth/invalid-credential"
        ? "Aktualne hasło jest nieprawidłowe."
        : code === "auth/weak-password" ? "Nowe hasło jest zbyt słabe."
        : code === "auth/requires-recent-login" ? "Zaloguj się ponownie i spróbuj jeszcze raz."
        : "Nie udało się zmienić hasła. Sprawdź aktualne hasło i spróbuj ponownie.");
    } finally { setBusy(false); }
  }

  async function resetPassword() {
    if (!user?.email) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await sendPasswordResetEmail(auth, user.email);
      setNotice("Wysłaliśmy wiadomość z linkiem do ustawienia nowego hasła.");
    } catch {
      setError("Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.");
    } finally { setBusy(false); }
  }

  const emailPasswordAccount = user?.providerData.some((provider) => provider.providerId === "password") ?? false;

  return (
    <main className="mx-auto min-h-[55vh] max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Nature-World</p>
      <h1 className="mt-2 text-3xl font-semibold text-[#173d2b]">Moje konto</h1>
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf3e9] text-primary"><UserRound /></div>
            <h2 className="mt-5 text-lg font-semibold text-[#173d2b]">Dane logowania</h2>
            <p className="mt-2 text-sm text-text-secondary">Zalogowano jako</p>
            <p className="mt-1 break-all font-medium text-[#173d2b]">{user?.email}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className={`rounded-full px-3 py-1 font-medium ${verified ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                {verified ? "E-mail zweryfikowany" : "E-mail niezweryfikowany"}
              </span>
              {!verified && <button type="button" onClick={sendVerification} disabled={busy} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/20 px-3 font-semibold text-primary hover:bg-[#edf3e9] disabled:opacity-60"><MailCheck size={16} /> Wyślij link</button>}
              {!verified && <button type="button" onClick={refreshVerification} disabled={busy} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-black/10 px-3 font-medium text-[#365443] hover:bg-gray-50 disabled:opacity-60"><RefreshCw size={15} /> Odśwież status</button>}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/sklep" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-white hover:bg-[#24652a]">Przejdź do sklepu <ArrowRight size={16} /></Link>
              <button type="button" onClick={() => void logout()} className="min-h-11 rounded-full border border-black/10 px-5 font-semibold text-[#365443] hover:bg-gray-50">Wyloguj</button>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf3e9] text-primary"><KeyRound /></div>
            <h2 className="mt-4 text-lg font-semibold text-[#173d2b]">Bezpieczeństwo konta</h2>
            {emailPasswordAccount ? (
              <form onSubmit={changePassword} className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-[#365443]">Aktualne hasło<input required autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-black/10 px-3 text-[#173d2b] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                <label className="block text-sm font-medium text-[#365443]">Nowe hasło<input required minLength={6} maxLength={70} autoComplete="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-black/10 px-3 text-[#173d2b] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                <label className="block text-sm font-medium text-[#365443]">Powtórz nowe hasło<input required minLength={6} maxLength={70} autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-black/10 px-3 text-[#173d2b] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
                <button disabled={busy} className="min-h-11 rounded-full bg-[#173d2b] px-5 font-semibold text-white hover:bg-[#245c3c] disabled:opacity-60">Zmień hasło</button>
              </form>
            ) : <div className="mt-4"><p className="text-sm leading-6 text-text-secondary">To konto korzysta z zewnętrznego logowania. Możesz ustawić hasło przez wiadomość e-mail.</p><button type="button" onClick={resetPassword} disabled={busy} className="mt-4 min-h-11 rounded-full border border-primary/20 px-5 font-semibold text-primary hover:bg-[#edf3e9] disabled:opacity-60">Wyślij link do ustawienia hasła</button></div>}
          </section>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf3e9] text-primary"><Package /></div><div><h2 className="text-lg font-semibold text-[#173d2b]">Moje zamówienia</h2><p className="text-sm text-text-secondary">Historia zamówień przypisanych do tego adresu e-mail</p></div></div>
          {!verified ? <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">Zweryfikuj adres e-mail, aby bezpiecznie wyświetlić zamówienia złożone na ten adres.</div> : ordersError ? <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800">{ordersError}<button onClick={() => void loadOrders()} className="ml-2 font-semibold underline">Spróbuj ponownie</button></div> : null}
          {verified && ordersLoading && orders.length === 0 && <p className="mt-6 flex items-center gap-2 text-sm text-text-secondary"><LoaderCircle className="animate-spin" size={16} /> Wczytujemy zamówienia…</p>}
          {verified && !ordersLoading && !ordersError && orders.length === 0 && <p className="mt-6 rounded-2xl bg-[#f5f7f2] p-5 text-sm leading-6 text-text-secondary">Nie znaleźliśmy jeszcze zamówień złożonych na adres {user?.email}.</p>}
          <div className="mt-5 space-y-4">
            {orders.map((order) => <article key={order.id} className="rounded-2xl border border-black/5 p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-[#173d2b]">{order.orderNumber}</p><p className="mt-1 text-xs text-text-secondary">{order.createdAt ? new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt)) : "Data niedostępna"}</p></div><p className="font-bold text-[#173d2b]">{formatPrice(order.total)}</p></div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium"><span className="rounded-full bg-[#edf3e9] px-3 py-1 text-[#365443]">{fulfillmentLabels[order.fulfillmentStatus] ?? order.fulfillmentStatus}</span><span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{paymentLabels[order.paymentStatus] ?? order.paymentStatus}</span></div>
              <ul className="mt-4 space-y-2 border-t border-black/5 pt-3 text-sm">{order.items.map((item, index) => <li key={`${item.name}-${index}`} className="flex justify-between gap-3 text-[#365443]"><span>{item.name} <span className="text-text-secondary">× {item.quantity}</span></span><span className="shrink-0">{formatPrice(item.lineTotal)}</span></li>)}</ul>
              <p className="mt-3 text-xs text-text-secondary">Dostawa: {formatPrice(order.deliveryCost)}{order.discountTotal > 0 ? ` · Rabat: ${formatPrice(order.discountTotal)}` : ""}</p>
            </article>)}
          </div>
          {nextCursor && <button type="button" disabled={ordersLoading} onClick={() => void loadOrders(nextCursor)} className="mt-5 min-h-11 rounded-full border border-primary/20 px-5 font-semibold text-primary hover:bg-[#edf3e9] disabled:opacity-60">{ordersLoading ? "Wczytywanie…" : "Pokaż starsze zamówienia"}</button>}
        </section>
      </div>
      {(notice || error) && <div aria-live="polite" className={`mt-5 rounded-xl p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`}>{error || notice}</div>}
    </main>
  );
}

export default function KontoPage() {
  return <ProtectedRoute><KontoContent /></ProtectedRoute>;
}
