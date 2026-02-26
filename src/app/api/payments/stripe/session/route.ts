import { NextRequest, NextResponse } from "next/server";

import { getStripeClient } from "@/lib/stripe-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() || "";

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId fehlt." },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      paid,
      packageKey: session.metadata?.packageKey || null,
      customerEmail:
        session.customer_details?.email || session.customer_email || null,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (error) {
    console.error("[payments/stripe/session]", error);

    const message =
      error instanceof Error && error.message.includes("STRIPE_SECRET_KEY")
        ? "Stripe ist noch nicht konfiguriert."
        : "Stripe-Zahlung konnte nicht verifiziert werden.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
