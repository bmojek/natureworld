"use client";

import { useState, type FormEvent } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { LoaderCircle } from "lucide-react";

export default function StripePaymentForm({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setError("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/sklep/checkout` },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Nie udało się wykonać płatności. Spróbuj ponownie.");
      setSubmitting(false);
      return;
    }
    if (result.paymentIntent?.status === "succeeded") onPaid();
    else {
      setError("Płatność jest przetwarzana. Nie składaj zamówienia ponownie.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border border-[#dce8d7] bg-[#fbfcfa] p-5">
      <h2 className="text-lg font-semibold text-[#173d2b]">Płatność online</h2>
      <PaymentElement options={{ layout: "accordion" }} />
      {error && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{error}</p>}
      <button type="submit" disabled={!stripe || submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-white disabled:opacity-60">
        {submitting && <LoaderCircle size={18} className="animate-spin" />}
        {submitting ? "Przetwarzanie płatności…" : "Zapłać bezpiecznie"}
      </button>
      <p className="text-xs leading-5 text-text-secondary">Dane płatnicze są obsługiwane przez Stripe i nie są zapisywane w sklepie.</p>
    </form>
  );
}
