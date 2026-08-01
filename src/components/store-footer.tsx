import Link from "next/link";
import type { Locale } from "@/lib/types";
import { copy } from "@/lib/i18n";

export function StoreFooter({ locale, storeName }: { locale: Locale; storeName: string }) {
  const t = copy[locale];
  return (
    <footer className="mt-auto border-t bg-[#191b1a] text-white">
      <div className="shell grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="text-lg font-black uppercase">{storeName}<span className="text-[var(--accent)]">.</span></div>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/65">{t.footerBody}</p>
        </div>
        <div><div className="text-xs font-bold uppercase text-white/45">{t.footerShop}</div><div className="mt-4 grid gap-3 text-sm"><Link href="/shop">{t.allProducts}</Link><Link href="/shop?category=Bags">{t.bags}</Link><Link href="/shop?category=Travel">{t.travel}</Link></div></div>
        <div><div className="text-xs font-bold uppercase text-white/45">{t.company}</div><div className="mt-4 grid gap-3 text-sm"><Link href="/#approach">{t.story}</Link><Link href="/creators">{t.creators}</Link><Link href="/support">{t.support}</Link></div></div>
        <div><div className="text-xs font-bold uppercase text-white/45">{t.operations}</div><div className="mt-4 grid gap-3 text-sm"><Link href="/login?role=admin">{t.admin}</Link><Link href="/login?role=affiliate">{t.creatorPortal}</Link><Link href="/login?role=support">{t.supportInbox}</Link></div></div>
      </div>
      <div className="shell border-t border-white/10 py-5 text-xs text-white/45">© 2026 {storeName}. {t.demoEnvironment}</div>
    </footer>
  );
}
