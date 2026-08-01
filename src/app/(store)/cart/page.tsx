"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useStoreLocale } from "@/components/store-locale-provider";
import { copy, formatCurrency } from "@/lib/i18n";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const locale = useStoreLocale();
  const t = copy[locale];
  return (
    <div className="shell py-10 md:py-16">
      <div className="border-b pb-7"><p className="eyebrow text-[var(--accent)]">{t.cartSelection}</p><h1 className="mt-2 text-4xl font-bold md:text-5xl">{t.shoppingCart}</h1></div>
      {!items.length ? <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><ShoppingBag size={34} strokeWidth={1.5} /><h2 className="mt-5 text-2xl font-bold">{t.cartEmpty}</h2><p className="mt-2 text-[var(--muted)]">{t.cartEmptyBody}</p><Link href="/shop" className="button-primary mt-6">{t.browseProducts}</Link></div> : (
        <div className="grid gap-10 py-8 lg:grid-cols-[1fr_360px]">
          <div className="divide-y">{items.map((item) => <div key={item.id} className="grid grid-cols-[92px_1fr] gap-4 py-5 md:grid-cols-[110px_1fr_auto]"><div className="relative aspect-square overflow-hidden rounded-[5px] bg-[#e9e9e5]"><Image src={item.image} alt={item.name} fill sizes="110px" className="object-cover" /></div><div><Link href={`/product/${item.slug}`} className="font-bold hover:text-[var(--accent)]">{item.name}</Link><p className="mt-1 text-sm text-[var(--muted)]">{formatCurrency(item.price)}</p><div className="mt-4 inline-flex h-9 items-center rounded-[4px] border bg-white"><button title={t.decrease} onClick={() => updateQuantity(item.id, item.quantity - 1)} className="flex size-9 items-center justify-center"><Minus size={14} /></button><span className="w-8 text-center text-sm font-semibold">{item.quantity}</span><button title={t.increase} onClick={() => updateQuantity(item.id, item.quantity + 1)} className="flex size-9 items-center justify-center"><Plus size={14} /></button></div></div><div className="col-start-2 flex items-center justify-between md:col-start-auto md:block md:text-right"><div className="font-bold">{formatCurrency(item.price * item.quantity)}</div><button title={t.remove} onClick={() => removeItem(item.id)} className="mt-0 inline-flex size-9 items-center justify-center text-gray-400 hover:text-[var(--accent)] md:mt-8"><Trash2 size={17} /></button></div></div>)}</div>
          <aside className="panel h-fit p-6"><h2 className="text-lg font-bold">{t.orderSummary}</h2><div className="mt-6 grid gap-3 border-b pb-5 text-sm"><div className="flex justify-between"><span className="text-[var(--muted)]">{t.subtotal}</span><span>{formatCurrency(subtotal)}</span></div><div className="flex justify-between"><span className="text-[var(--muted)]">{t.shipping}</span><span>{subtotal >= 100 ? t.free : "$12.00"}</span></div></div><div className="flex justify-between py-5 text-lg font-bold"><span>{t.total}</span><span>{formatCurrency(subtotal + (subtotal >= 100 ? 0 : 12))}</span></div><Link href="/checkout" className="button-primary w-full">{t.checkoutSecurely}</Link><p className="mt-4 text-center text-xs text-[var(--muted)]">{t.taxesAtCheckout}</p></aside>
        </div>
      )}
    </div>
  );
}
