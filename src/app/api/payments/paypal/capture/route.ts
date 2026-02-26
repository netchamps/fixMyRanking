import { NextRequest, NextResponse } from "next/server";

import {
  capturePayPalOrder,
  getPayPalOrder,
  isOrderAlreadyCapturedError,
  PayPalRequestError,
} from "@/lib/paypal-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CapturePayload = {
  orderId?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as CapturePayload | null;
    const orderId =
      payload && typeof payload.orderId === "string" ? payload.orderId.trim() : "";

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId fehlt." },
        { status: 400 },
      );
    }

    try {
      const captured = await capturePayPalOrder(orderId);

      return NextResponse.json({
        orderId: captured.orderId,
        status: captured.status,
        captured: captured.status === "COMPLETED",
      });
    } catch (error) {
      if (!isOrderAlreadyCapturedError(error)) {
        throw error;
      }

      const order = await getPayPalOrder(orderId);

      return NextResponse.json({
        orderId: order.orderId,
        status: order.status,
        captured: order.status === "COMPLETED",
      });
    }
  } catch (error) {
    console.error("[payments/paypal/capture]", error);

    const message =
      error instanceof PayPalRequestError
        ? error.message
        : error instanceof Error &&
            error.message.includes("PAYPAL_CLIENT_ID")
          ? "PayPal ist noch nicht konfiguriert."
          : "PayPal-Zahlung konnte nicht abgeschlossen werden.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
