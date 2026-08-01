import Link from "next/link";
import { CircleUserRound, Menu, MessageCircle } from "lucide-react";
import type { Locale } from "@/lib/types";
import { copy } from "@/lib/i18n";
import { setLocale } from "@/app/actions";
import { CartLink } from "@/components/cart-link";

export function StoreHeader({ locale, storeName }: { locale: Locale; storeName: string }) {
  const t = copy[locale];
  return (
    <>
      <div className="bg-[#191b1a] px-4 py-2 text-center text-[11px] font-semibold text-white">{t.freeShipping}</div>
      <header className="sticky top-0 z-40 border-b bg-[rgba(247,247,244,0.94)] backdrop-blur">
        <div className="shell flex h-[70px] items-center justify-between gap-6">
          <Link href="/" className="text-[18px] font-black uppercase">{storeName}<span className="text-[var(--accent)]">.</span></Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            <Link href="/shop" className="text-sm font-semibold hover:text-[var(--accent)]">{t.shop}</Link>
            <Link href="/#approach" className="text-sm font-semibold hover:text-[var(--accent)]">{t.story}</Link>
            <Link href="/creators" className="text-sm font-semibold hover:text-[var(--accent)]">{t.creators}</Link>
            <Link href="/support" className="text-sm font-semibold hover:text-[var(--accent)]">{t.support}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <form action={setLocale} className="flex h-9 items-center rounded-[4px] border bg-white p-0.5" aria-label="Language">
              <button name="locale" value="en" className={`h-7 px-2 text-[11px] font-bold ${locale === "en" ? "bg-black text-white" : "text-gray-500"}`}>EN</button>
              <button name="locale" value="zh" className={`h-7 px-2 text-[11px] font-bold ${locale === "zh" ? "bg-black text-white" : "text-gray-500"}`}>中文</button>
            </form>
            <Link href="/support" title={t.support} className="hidden size-10 items-center justify-center sm:flex"><MessageCircle size={19} /></Link>
            <Link href="/login" title={t.account} className="hidden size-10 items-center justify-center sm:flex"><CircleUserRound size={19} /></Link>
            <CartLink label={t.cart} />
            <button type="button" title="Menu" className="flex size-10 items-center justify-center lg:hidden"><Menu size={20} /></button>
          </div>
        </div>
      </header>
    </>
  );
}
