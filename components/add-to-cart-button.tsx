"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import type { CartItem } from "@/lib/types";
import { useCart } from "./cart-provider";
import { useSitePreferences } from "./site-preferences";

type Props = {
  item: Omit<CartItem, "quantity">;
  compact?: boolean;
};

export function AddToCartButton({ item, compact }: Props) {
  const { addItem, hasItem } = useCart();
  const { text } = useSitePreferences();
  const [done, setDone] = useState(false);
  const alreadyInCart = hasItem(item.slug);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      whileHover={alreadyInCart ? undefined : { y: -1 }}
      disabled={alreadyInCart}
      onClick={() => {
        if (alreadyInCart) return;
        addItem(item);
        setDone(true);
        window.setTimeout(() => setDone(false), 1200);
      }}
      className={`btn-primary ${compact ? "h-11 px-4 text-sm" : "h-12 px-5 text-sm"} disabled:cursor-not-allowed disabled:opacity-80`}
    >
      {done || alreadyInCart ? <Check size={16} /> : <ShoppingCart size={16} />}
      {alreadyInCart
        ? text({ ar: "موجود في السلة", en: "In cart" })
        : done
          ? text({ ar: "أضيفت", en: "Added" })
          : text({ ar: "إضافة إلى السلة", en: "Add to cart" })}
    </motion.button>
  );
}
