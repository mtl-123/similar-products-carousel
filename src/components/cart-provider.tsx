"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  id: number;
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = "northstar_cart";

function persistCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function readCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed as CartItem[] : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setItems(readCart()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const addItem = useCallback((next: Omit<CartItem, "quantity">, quantity = 1) => {
    const safeQuantity = Math.max(1, Math.min(20, quantity));
    const current = readCart();
    const existing = current.find((item) => item.id === next.id);
    const updated = existing
      ? current.map((item) => item.id === next.id ? { ...item, quantity: Math.min(20, item.quantity + safeQuantity) } : item)
      : [...current, { ...next, quantity: safeQuantity }];
    persistCart(updated);
    setItems(updated);
  }, []);

  const removeItem = useCallback((id: number) => {
    const updated = readCart().filter((item) => item.id !== id);
    persistCart(updated);
    setItems(updated);
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    const updated = readCart().map((item) => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item);
    persistCart(updated);
    setItems(updated);
  }, []);

  const clear = useCallback(() => {
    persistCart([]);
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem,
    removeItem,
    updateQuantity,
    clear,
  }), [items, addItem, removeItem, updateQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
