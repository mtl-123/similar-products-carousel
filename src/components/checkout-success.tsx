"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

export function CheckoutSuccess() {
  const { clear } = useCart();
  useEffect(() => clear(), [clear]);
  return null;
}
