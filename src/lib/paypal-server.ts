type PayPalLink = {
  href?: string;
  rel?: string;
};

type PayPalOrderResponse = {
  id?: string;
  status?: string;
  links?: PayPalLink[];
};

type PayPalErrorResponse = {
  message?: string;
  details?: Array<{
    issue?: string;
    description?: string;
  }>;
};

const DEFAULT_PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";

export class PayPalRequestError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function getPayPalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be configured.");
  }

  const apiBase =
    process.env.PAYPAL_API_BASE?.trim().replace(/\/+$/, "") ||
    DEFAULT_PAYPAL_API_BASE;

  return { clientId, clientSecret, apiBase };
}

async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  const payload = (await response.json().catch(() => null)) as T | null;
  return payload;
}

async function getPayPalAccessToken(): Promise<string> {
  const { clientId, clientSecret, apiBase } = getPayPalConfig();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  const parsed = await parseJsonSafely<{ access_token?: string }>(response);

  if (!response.ok || !parsed?.access_token) {
    throw new PayPalRequestError(
      "Unable to retrieve PayPal access token.",
      response.status || 502,
      parsed,
    );
  }

  return parsed.access_token;
}

function getPayPalErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "PayPal request failed.";
  }

  const body = payload as PayPalErrorResponse;
  const detail = body.details?.find((entry) => typeof entry?.description === "string");

  return detail?.description || body.message || "PayPal request failed.";
}

export async function createPayPalOrder(input: {
  amountValue: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  customId: string;
}): Promise<{ orderId: string; approveUrl: string; status: string | null }> {
  const { apiBase } = getPayPalConfig();
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${apiBase}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": crypto.randomUUID(),
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: input.amountValue,
          },
          description: input.description,
          custom_id: input.customId,
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "FixMyRanking",
            locale: "de-DE",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    }),
    cache: "no-store",
  });

  const parsed = await parseJsonSafely<PayPalOrderResponse | PayPalErrorResponse>(
    response,
  );

  if (!response.ok || !parsed || typeof (parsed as PayPalOrderResponse).id !== "string") {
    throw new PayPalRequestError(
      getPayPalErrorMessage(parsed),
      response.status || 502,
      parsed,
    );
  }

  const order = parsed as PayPalOrderResponse;
  const orderId = order.id as string;
  const approveUrl = order.links?.find((link) => link.rel === "approve")?.href;

  if (!approveUrl) {
    throw new PayPalRequestError("PayPal approval link missing.", 502, order);
  }

  return {
    orderId,
    approveUrl,
    status: typeof order.status === "string" ? order.status : null,
  };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  orderId: string;
  status: string | null;
}> {
  const { apiBase } = getPayPalConfig();
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${apiBase}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": crypto.randomUUID(),
      },
      cache: "no-store",
    },
  );

  const parsed = await parseJsonSafely<PayPalOrderResponse | PayPalErrorResponse>(
    response,
  );

  if (!response.ok || !parsed || typeof (parsed as PayPalOrderResponse).id !== "string") {
    throw new PayPalRequestError(
      getPayPalErrorMessage(parsed),
      response.status || 502,
      parsed,
    );
  }

  const order = parsed as PayPalOrderResponse;
  const parsedOrderId = order.id as string;

  return {
    orderId: parsedOrderId,
    status: typeof order.status === "string" ? order.status : null,
  };
}

export async function getPayPalOrder(orderId: string): Promise<{
  orderId: string;
  status: string | null;
}> {
  const { apiBase } = getPayPalConfig();
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${apiBase}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const parsed = await parseJsonSafely<PayPalOrderResponse | PayPalErrorResponse>(
    response,
  );

  if (!response.ok || !parsed || typeof (parsed as PayPalOrderResponse).id !== "string") {
    throw new PayPalRequestError(
      getPayPalErrorMessage(parsed),
      response.status || 502,
      parsed,
    );
  }

  const order = parsed as PayPalOrderResponse;
  const parsedOrderId = order.id as string;

  return {
    orderId: parsedOrderId,
    status: typeof order.status === "string" ? order.status : null,
  };
}

export function isOrderAlreadyCapturedError(error: unknown): boolean {
  if (!(error instanceof PayPalRequestError)) {
    return false;
  }

  if (!error.body || typeof error.body !== "object") {
    return false;
  }

  const payload = error.body as PayPalErrorResponse;

  return Boolean(
    payload.details?.some((detail) => detail?.issue === "ORDER_ALREADY_CAPTURED"),
  );
}
