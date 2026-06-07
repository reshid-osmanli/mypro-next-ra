import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? process.env.PAYPAL_CLIENT_ID ?? "";
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET ?? "";
const paypalEnvironment = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
const paypalBaseUrl = paypalEnvironment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
const stripeCurrency = (process.env.STRIPE_CURRENCY ?? process.env.NEXT_PUBLIC_STRIPE_CURRENCY ?? "usd").toLowerCase();

function getStripeClient() {
  if (!stripeSecretKey) {
    throw new Error("Stripe is not configured");
  }

  return new Stripe(stripeSecretKey);
}

export function paymentProviders() {
  return [
    {
      id: "paypal",
      name: "PayPal",
      enabled: Boolean(paypalClientId && paypalClientSecret)
    },
    {
      id: "stripe",
      name: "Stripe",
      enabled: Boolean(stripeSecretKey)
    }
  ] as const;
}

export async function createStripeSession(params: {
  orderReference: string;
  items: { title: string; price: number; quantity: number }[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  currency?: string;
  discountAmount?: number;
}) {
  const stripe = getStripeClient();
  const currency = (params.currency ?? stripeCurrency).toLowerCase();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    client_reference_id: params.orderReference,
    metadata: {
      orderId: params.orderReference,
      discountAmount: String(params.discountAmount ?? 0)
    },
    payment_intent_data: {
      metadata: {
        orderId: params.orderReference
      }
    },
    discounts: params.discountAmount && params.discountAmount > 0
      ? [{ coupon: await createStripeDiscount(params.discountAmount, currency) }]
      : undefined,
    line_items: params.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency,
        product_data: { name: item.title },
        unit_amount: Math.round(item.price * 100)
      }
    }))
  });

  return { id: session.id, url: session.url ?? params.cancelUrl };
}

async function createStripeDiscount(amount: number, currency: string) {
  const stripe = getStripeClient();
  return (await stripe.coupons.create({
    amount_off: Math.round(amount * 100),
    currency
  })).id;
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"]
  });
}

export function expectedStripeCurrency() {
  return stripeCurrency.toUpperCase();
}

async function paypalErrorMessage(res: Response, fallback: string) {
  const debugId = res.headers.get("paypal-debug-id");
  const raw = await res.text().catch(() => "");
  let details = raw;

  try {
    const parsed = JSON.parse(raw) as { message?: string; name?: string; details?: Array<{ issue?: string; description?: string }> };
    details = parsed.details?.map((item) => item.description || item.issue).filter(Boolean).join("; ") || parsed.message || parsed.name || raw;
  } catch {
    details = raw;
  }

  return [fallback, `status ${res.status}`, debugId ? `debug ${debugId}` : "", details ? details.slice(0, 400) : ""].filter(Boolean).join(" - ");
}

async function getPaypalAccessToken() {
  if (!paypalClientId || !paypalClientSecret) {
    throw new Error("PayPal is not configured");
  }

  const auth = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString("base64");
  const res = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "client_credentials" })
  });

  if (!res.ok) throw new Error(await paypalErrorMessage(res, "Unable to get a PayPal access token"));

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export type PaypalOrderInput = {
  orderReference: string;
  amount: number;
  currency?: string;
  items: { title: string; price: number; quantity: number }[];
  customer?: { name?: string; email?: string; phone?: string; notes?: string };
};

export async function createPaypalOrder(input: PaypalOrderInput) {
  const accessToken = await getPaypalAccessToken();
  const currency = (input.currency ?? process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ?? "USD").toUpperCase();
  const total = input.amount.toFixed(2);
  const description = (input.customer?.notes || "Order from Kutubi").slice(0, 127);

  const res = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": input.orderReference
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.orderReference,
          custom_id: input.orderReference,
          description,
          amount: {
            currency_code: currency,
            value: total,
            breakdown: {
              item_total: {
                currency_code: currency,
                value: total
              }
            }
          },
          items: input.items.map((item) => ({
            name: item.title.slice(0, 127),
            quantity: String(item.quantity),
            unit_amount: {
              currency_code: currency,
              value: item.price.toFixed(2)
            }
          }))
        }
      ]
    })
  });

  if (!res.ok) throw new Error(await paypalErrorMessage(res, "Unable to create the PayPal order"));

  return (await res.json()) as { id: string };
}

export async function capturePaypalOrder(orderId: string, requestId?: string) {
  const accessToken = await getPaypalAccessToken();

  const res = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(requestId ? { "PayPal-Request-Id": requestId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 108) } : {})
    }
  });

  if (!res.ok) throw new Error(await paypalErrorMessage(res, "Unable to capture the PayPal order"));

  return res.json() as Promise<{
    id: string;
    status: string;
    payer?: { name?: { given_name?: string; surname?: string }; email_address?: string };
  }>;
}

export async function retrievePaypalOrder(orderId: string) {
  const accessToken = await getPaypalAccessToken();

  const res = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  if (!res.ok) throw new Error(await paypalErrorMessage(res, "Unable to retrieve the PayPal order"));

  return res.json() as Promise<{
    id: string;
    status: string;
    purchase_units?: Array<{
      reference_id?: string;
      custom_id?: string;
      payments?: {
        captures?: Array<{
          id?: string;
          status?: string;
          amount?: {
            currency_code?: string;
            value?: string;
          };
          custom_id?: string;
        }>;
      };
    }>;
  }>;
}

export function paypalClientIdOrEmpty() {
  return paypalClientId;
}
