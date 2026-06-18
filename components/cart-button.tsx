"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";
import { useSitePreferences } from "./site-preferences";

export function CartButton() {
  const { items } = useCart();
  const { text } = useSitePreferences();
  const count = items.length;

  return (
    <Link href="/cart" className="btn-secondary h-10 px-3 py-0 text-qatar-800">
      <ShoppingBag size={18} />
      <span>{text({ ar: "السلة", en: "Cart" })}</span>
      <span className="rounded-[8px] bg-qatar-700 px-2 py-0.5 text-xs text-white">{count}</span>
    </Link>
  );
}
