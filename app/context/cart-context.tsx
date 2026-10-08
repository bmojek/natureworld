"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CartItem } from "@/app/models/cart";

type CartContextType = {
  items: CartItem[];
  ready: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;

  total: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed as CartItem[]);
      }
    } catch {
      localStorage.removeItem("cart");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items, ready]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const found = prev.find((p) => p.productId === item.productId);
      if (found) {
        return prev.map((p) =>
          p.productId === item.productId ? { ...p, qty: p.qty + item.qty } : p,
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, qty } : p)),
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, ready, addItem, removeItem, updateQty, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
