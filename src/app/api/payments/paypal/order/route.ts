import { NextRequest, NextResponse } from "next/server";

import {
  checkoutPackageData,
  isCheckoutPackage,
  parseBillingFormData,
  toOptionalText,
} from "@/lib/checkout-config";
import { createPayPalOrder, PayPalRequestError } from "@/lib/paypal-server";
import { resolveAppBaseUrl } from "@/lib/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PayPalOrderPayload = {
  packageKey?: unknown;
  paymentMethod?: unknown;
  billing?: unknown;
  location?: unknown;
  keyword?: unknown;
  businessName?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as PayPalOrderPayload | null;

    if (!payload || !isCheckoutPackage(payload.packageKey)) {
      return NextResponse.json(
        { error: "Ungültiges Paket." },
        { status: 400 },
      );
    }

    if (payload.paymentMethod !== "paypal") {
      return NextResponse.json(
        { error: "Ungültige Zahlungsmethode für PayPal." },
        { status: 400 },
      );
    }

    const billing = parseBillingFormData(payload.billing);

    if (!billing) {
      return NextResponse.json(
        { error: "Bitte fülle alle Pflichtfelder korrekt aus." },
        { status: 400 },
      );
    }

    const packageConfig = checkoutPackageData[payload.packageKey];
    const baseUrl = resolveAppBaseUrl(request);
    const location = toOptionalText(payload.location, 120) || "none";
    const keyword = toOptionalText(payload.keyword, 120) || "none";
    const businessName = toOptionalText(payload.businessName, 120) || "none";

    const customId = [
      payload.packageKey,
      location.slice(0, 24),
      keyword.slice(0, 24),
      businessName.slice(0, 24),
    ]
      .join("|")
      .slice(0, 127);

    const order = await createPayPalOrder({
      amountValue: packageConfig.totalPrice.toFixed(2),
      description: packageConfig.name,
      customId,
      returnUrl: `${baseUrl}/checkout/success?provider=paypal`,
      cancelUrl: `${baseUrl}/checkout/cancel?provider=paypal`,
    });

    return NextResponse.json({
      redirectUrl: order.approveUrl,
      orderId: order.orderId,
      status: order.status,
    });
  } catch (error) {
    console.error("[payments/paypal/order]", error);

    const message =
      error instanceof PayPalRequestError
        ? error.message
        : error instanceof Error &&
            error.message.includes("PAYPAL_CLIENT_ID")
          ? "PayPal ist noch nicht konfiguriert."
          : "PayPal Checkout konnte nicht gestartet werden.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
