import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import {
  checkoutPackageData,
  getPackageTotalInCents,
  isCheckoutPackage,
  parseBillingFormData,
  toOptionalText,
} from "@/lib/checkout-config";
import { getStripeClient } from "@/lib/stripe-server";
import { resolveAppBaseUrl } from "@/lib/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StripeCheckoutPayload = {
  packageKey?: unknown;
  paymentMethod?: unknown;
  billing?: unknown;
  location?: unknown;
  keyword?: unknown;
  businessName?: unknown;
};

function isStripePaymentMethod(value: unknown): value is "card" | "sepa" {
  return value === "card" || value === "sepa";
}

function normalizePhoneForStripe(phone: string): string | null {
  const trimmed = phone.trim();

  if (!trimmed) {
    return null;
  }

  const compact = trimmed.replace(/\s+/g, "");
  const digitsOnly = compact.replace(/[^\d]/g, "");

  if (!digitsOnly) {
    return null;
  }

  let candidate = compact;

  if (candidate.startsWith("00")) {
    candidate = `+${candidate.slice(2)}`;
  }

  if (!candidate.startsWith("+")) {
    // If user enters German local format (e.g. 01512...), convert to +49...
    if (digitsOnly.startsWith("0")) {
      candidate = `+49${digitsOnly.slice(1)}`;
    } else {
      candidate = `+${digitsOnly}`;
    }
  }

  const e164Like = `+${candidate.replace(/[^\d]/g, "")}`;

  if (!/^\+[1-9]\d{7,14}$/.test(e164Like)) {
    return null;
  }

  return e164Like;
}

async function upsertStripeCustomer(input: {
  stripe: Stripe;
  email: string;
  contact: string;
  company: string;
  normalizedPhone: string | null;
}): Promise<string> {
  const existingCustomers = await input.stripe.customers.list({
    email: input.email,
    limit: 5,
  });

  const existingCustomer = existingCustomers.data.find(
    (customer) => !("deleted" in customer),
  );

  if (!existingCustomer) {
    const createdCustomer = await input.stripe.customers.create({
      email: input.email,
      name: input.contact,
      phone: input.normalizedPhone || undefined,
      metadata: {
        company: input.company,
      },
    });

    return createdCustomer.id;
  }

  const updates: Stripe.CustomerUpdateParams = {};

  if (!existingCustomer.name && input.contact) {
    updates.name = input.contact;
  }

  if (input.normalizedPhone && existingCustomer.phone !== input.normalizedPhone) {
    updates.phone = input.normalizedPhone;
  }

  if (Object.keys(updates).length > 0) {
    await input.stripe.customers.update(existingCustomer.id, updates);
  }

  return existingCustomer.id;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as StripeCheckoutPayload | null;

    if (!payload || !isCheckoutPackage(payload.packageKey)) {
      return NextResponse.json(
        { error: "Ungültiges Paket." },
        { status: 400 },
      );
    }

    if (!isStripePaymentMethod(payload.paymentMethod)) {
      return NextResponse.json(
        { error: "Ungültige Zahlungsmethode für Stripe." },
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
    const paymentMethodTypes: Array<"card" | "sepa_debit"> =
      payload.paymentMethod === "sepa" ? ["sepa_debit"] : ["card"];
    const normalizedPhone = normalizePhoneForStripe(billing.phone);

    const metadata: Record<string, string> = {
      packageKey: payload.packageKey,
      paymentMethod: payload.paymentMethod,
      company: billing.company,
      contact: billing.contact,
      email: billing.email,
      phone: normalizedPhone || billing.phone,
      street: billing.street,
      zip: billing.zip,
      city: billing.city,
      country: billing.country,
    };

    if (normalizedPhone) {
      metadata.phoneOriginal = billing.phone;
    }

    if (billing.vatId) {
      metadata.vatId = billing.vatId;
    }

    const location = toOptionalText(payload.location, 120);
    const keyword = toOptionalText(payload.keyword, 120);
    const businessName = toOptionalText(payload.businessName, 120);

    if (location) {
      metadata.location = location;
    }

    if (keyword) {
      metadata.keyword = keyword;
    }

    if (businessName) {
      metadata.businessName = businessName;
    }

    const stripe = getStripeClient();
    const customerId = await upsertStripeCustomer({
      stripe,
      email: billing.email,
      contact: billing.contact,
      company: billing.company,
      normalizedPhone,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "de",
      success_url: `${baseUrl}/checkout/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel?provider=stripe`,
      customer: customerId,
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      payment_method_types: paymentMethodTypes,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: getPackageTotalInCents(payload.packageKey),
            product_data: {
              name: packageConfig.name,
              description: `Laufzeit: ${packageConfig.duration}`,
            },
          },
        },
      ],
      metadata,
    });

    if (!session.url) {
      throw new Error("Stripe session URL missing.");
    }

    return NextResponse.json({
      redirectUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("[payments/stripe/checkout]", error);

    const message =
      error instanceof Error && error.message.includes("STRIPE_SECRET_KEY")
        ? "Stripe ist noch nicht konfiguriert."
        : "Stripe Checkout konnte nicht gestartet werden.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
