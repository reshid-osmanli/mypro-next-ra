export function paypalSdkScriptUrl(clientId: string, currency = "USD") {
  const host =
    (process.env.NEXT_PUBLIC_PAYPAL_ENV ?? process.env.PAYPAL_ENV) === "live"
      ? "https://www.paypal.com"
      : "https://www.sandbox.paypal.com";

  const params = new URLSearchParams({
    "client-id": clientId,
    currency,
    intent: "capture",
    components: "buttons",
    "disable-funding": "card,credit,paylater"
  });

  return `${host}/sdk/js?${params.toString()}`;
}
