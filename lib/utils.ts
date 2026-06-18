export function cn(...values: Array<string | undefined | null | false>) {
  return values.filter(Boolean).join(" ");
}

const englishNumberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

export function numberLabel(value: number) {
  return englishNumberFormat.format(value);
}

export function currencyLabel(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function dateLabel(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(value));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${numberLabel(bytes)} B`;
  if (bytes < 1024 * 1024) return `${numberLabel(Math.round(bytes / 1024))} KB`;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}
