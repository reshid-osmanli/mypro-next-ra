import { z } from "zod";
import { MAX_UPLOAD_BYTES } from "./upload-policy";

export const MAX_CART_QUANTITY = 1;
export const MAX_CHECKOUT_ITEMS = 20;

export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

export const moneyAmountSchema = z.coerce.number().int().min(0).max(999_999);

export const checkoutItemSchema = z.object({
  id: z.string().trim().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(MAX_CART_QUANTITY)
});

export const checkoutItemsSchema = z.array(checkoutItemSchema).min(1).max(MAX_CHECKOUT_ITEMS);

export function isSafeCoverImageUrl(value?: string | null) {
  if (!value) return true;
  return /^\/uploads\/[a-zA-Z0-9_.-]+\.(?:png|jpe?g|webp)$/i.test(value.trim());
}

export function isSafePublicMotionLogoUrl(value?: string | null) {
  if (!value) return true;
  return /^\/uploads\/[a-zA-Z0-9_.-]+\.(?:png|jpe?g|webp|gif)$/i.test(value.trim());
}

export function normalizeOptionalStoredUrl(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export const coverImageSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .refine((value) => isSafeCoverImageUrl(value), "Untrusted cover image URL");

export const motionLogoSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .refine((value) => isSafePublicMotionLogoUrl(value), "Untrusted motion logo URL");

export const storedFileSizeSchema = z.coerce.number().int().min(1).max(MAX_UPLOAD_BYTES);
