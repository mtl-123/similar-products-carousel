"use client";

import { Check, LockKeyhole, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";

interface PurchaseCopy {
  addToCart: string;
  added: string;
  buyNow: string;
  decrease: string;
  increase: string;
  quantity: string;
  securePayment: string;
  soldOut: string;
}

export function ProductPurchasePanel({ product, inventory, labels }: {
  product: { id: number; slug: string; name: string; image: string; price: number };
  inventory: number;
  labels: PurchaseCopy;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const maximum = Math.max(1, Math.min(20, inventory));
  const unavailable = inventory < 1;

  function addSelection() {
    if (unavailable) return;
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  function buyNow() {
    if (unavailable) return;
    addItem(product, quantity);
    router.push("/checkout");
  }

  return (
    <div className="mt-7 border-t pt-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <span className="text-sm font-semibold">{labels.quantity}</span>
        <div className="inline-grid h-11 grid-cols-[42px_44px_42px] items-center rounded-[4px] border bg-white">
          <button
            type="button"
            title={labels.decrease}
            aria-label={labels.decrease}
            disabled={quantity <= 1 || unavailable}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            className="flex h-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus size={15} />
          </button>
          <span className="border-x text-center text-sm font-bold" aria-live="polite">{quantity}</span>
          <button
            type="button"
            title={labels.increase}
            aria-label={labels.increase}
            disabled={quantity >= maximum || unavailable}
            onClick={() => setQuantity((current) => Math.min(maximum, current + 1))}
            className="flex h-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <button type="button" disabled={unavailable} onClick={addSelection} className="button-primary w-full disabled:cursor-not-allowed disabled:bg-gray-400" data-testid="add-to-cart">
          {added ? <Check size={17} /> : <ShoppingBag size={17} />}
          <span>{unavailable ? labels.soldOut : added ? labels.added : labels.addToCart}</span>
        </button>
        <button type="button" disabled={unavailable} onClick={buyNow} className="button-secondary w-full border-black disabled:cursor-not-allowed disabled:opacity-50">
          <Zap size={17} />
          <span>{labels.buyNow}</span>
        </button>
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
        <LockKeyhole size={14} />{labels.securePayment}
      </p>
    </div>
  );
}
