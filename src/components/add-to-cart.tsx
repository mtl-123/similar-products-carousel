"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useStoreLocale } from "@/components/store-locale-provider";
import { copy } from "@/lib/i18n";

export function AddToCartButton({ product, label, compact = false }: {
  product: { id: number; slug: string; name: string; image: string; price: number };
  label: string;
  compact?: boolean;
}) {
  const { addItem } = useCart();
  const locale = useStoreLocale();
  const [added, setAdded] = useState(false);
  return (
    <button
      type="button"
      title={label}
      onClick={() => {
        addItem(product);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1100);
      }}
      className={compact ? "flex size-10 items-center justify-center rounded-[4px] bg-black text-white hover:bg-[var(--accent)]" : "button-primary w-full"}
    >
      {added ? <Check size={17} /> : <Plus size={17} />}
      {!compact && <span>{added ? copy[locale].added : label}</span>}
    </button>
  );
}
