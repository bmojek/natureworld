import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient, markStripeOrderPaid } from "@/app/lib/stripe-payment";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = getStripeClient().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    try {
      await markStripeOrderPaid(event.data.object as Stripe.PaymentIntent);
    } catch (cause) {
      console.error("Stripe webhook order update failed:", cause instanceof Error ? cause.message : "UNKNOWN_ERROR");
      return NextResponse.json({ error: "WEBHOOK_PROCESSING_FAILED" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
