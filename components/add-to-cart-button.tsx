"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useSitePreferences } from "@/components/site-preferences";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  item: Omit<import("@/lib/types").CartItem, "quantity"> & { coverImage?: string | null };
  compact?: boolean;
  size?: "sm" | "md" | "lg";
  /** open the drawer right after adding (default true) */
  openDrawerOnAdd?: boolean;
  className?: string;
};

/**
 * KUTUBI Add-to-cart — icon morphs to a check for 900ms,
 * then the cart drawer slides in (when openDrawerOnAdd).
 */
export function AddToCartButton({ item, compact = false, size = "md", openDrawerOnAdd = true, className }: Props) {
  const { addItem, hasItem, openDrawer } = useCart();
  const { text } = useSitePreferences();
  const [justAdded, setJustAdded] = useState(false);
  const alreadyInCart = hasItem(item.slug);

  return (
    <Button
      variant={alreadyInCart ? "secondary" : "primary"}
      size={size}
      loading={false}
      disabled={alreadyInCart}
      onClick={() => {
        if (alreadyInCart) return;
        addItem(item);
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 900);
        if (openDrawerOnAdd) {
          window.setTimeout(() => openDrawer(), 250);
        }
      }}
      className={cn(compact ? "px-4" : undefined, "min-w-40", className)}
    >
      {justAdded || alreadyInCart ? (
        <Check size={16} strokeWidth={2} className={justAdded ? "text-current" : undefined} aria-hidden="true" />
      ) : (
        <ShoppingBag size={16} strokeWidth={1.75} aria-hidden="true" />
      )}
      {alreadyInCart
        ? text({ ar: "في السلة", en: "In cart" })
        : justAdded
          ? text({ ar: "أُضيف", en: "Added" })
          : text({ ar: "أضف إلى السلة", en: "Add to cart" })}
    </Button>
  );
}
