"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";

export function CartLink({ label }: { label: string }) {
  const { count } = useCart();
  return (
    <Link href="/cart" className="relative flex h-10 items-center gap-2 px-1 text-sm font-semibold hover:text-[var(--accent)]">
      <ShoppingBag size={19} />
      <span className="hidden sm:inline">{label}</span>
      <span className="flex size-5 items-center justify-center rounded-full bg-black text-[10px] text-white" aria-label={`${count} items`}>{count}</span>
    </Link>
  );
}
