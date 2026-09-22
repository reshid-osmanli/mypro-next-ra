"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (slug: string) => void;
  increase: (slug: string) => void;
  decrease: (slug: string) => void;
  hasItem: (slug: string) => boolean;
  clearCart: () => void;
  hydrated: boolean;
  /** Drawer state — shared so any "add to cart" can open it. */
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kutubi-cart-v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          const normalized = parsed.reduce<CartItem[]>((acc, item) => {
            if (!item || typeof item.id !== "string" || typeof item.slug !== "string" || seen.has(item.slug)) {
              return acc;
            }

            seen.add(item.slug);
            acc.push({ ...item, quantity: 1 });
            return acc;
          }, []);

          setItems(normalized);
        }
      }
    } catch {
      // ignore corrupt storage
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  // lock scroll while the drawer is open
  useEffect(() => {
    if (!isDrawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isDrawerOpen]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      hydrated,
      addItem(item) {
        setItems((current) => {
          const existing = current.find((currentItem) => currentItem.slug === item.slug);
          if (existing) return current;
          return [...current, { ...item, quantity: 1 }];
        });
      },
      removeItem(slug) {
        setItems((current) => current.filter((item) => item.slug !== slug));
      },
      increase(slug) {
        setItems((current) => current.map((item) => (item.slug === slug ? { ...item, quantity: 1 } : item)));
      },
      decrease(slug) {
        setItems((current) => current.map((item) => (item.slug === slug ? { ...item, quantity: 1 } : item)));
      },
      hasItem(slug) {
        return items.some((item) => item.slug === slug);
      },
      clearCart() {
        setItems([]);
        localStorage.removeItem(STORAGE_KEY);
      },
      isDrawerOpen,
      openDrawer() {
        setDrawerOpen(true);
      },
      closeDrawer() {
        setDrawerOpen(false);
      }
    }),
    [items, hydrated, isDrawerOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
