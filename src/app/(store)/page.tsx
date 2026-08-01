import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PackageCheck, RefreshCcw, ShieldCheck } from "lucide-react";
import { getProducts } from "@/lib/db";
import { copy } from "@/lib/i18n";
import { getStoreLocale } from "@/lib/store-context";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getStoreLocale();
  const t = copy[locale];
  const products = getProducts({ featured: true, activeOnly: true }).slice(0, 4);
  const benefits = [
    { icon: PackageCheck, title: t.deliveryTitle, body: t.deliveryBody },
    { icon: RefreshCcw, title: t.returnsTitle, body: t.returnsBody },
    { icon: ShieldCheck, title: t.warrantyTitle, body: t.warrantyBody },
  ];
  return (
    <>
      <section className="relative min-h-[calc(100svh-132px)] overflow-hidden bg-black text-white md:min-h-[690px]">
        <Image src="https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=2200&q=90" alt="Northstar travel collection" fill priority sizes="100vw" className="object-cover object-center opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.1))]" />
        <div className="shell relative flex min-h-[calc(100svh-132px)] items-end pb-16 pt-28 md:min-h-[690px] md:items-center md:pb-10">
          <div className="max-w-[660px]">
            <p className="eyebrow mb-4 text-white/75">{t.eyebrow}</p>
            <h1 className="max-w-[650px] text-[clamp(42px,6vw,78px)] font-black leading-[0.98]">{t.heroTitle}</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/85 md:text-lg">{t.heroBody}</p>
            <Link href="/shop" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-[4px] bg-white px-5 text-sm font-bold text-black hover:bg-[var(--yellow)]">{t.shopNow}<ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <section className="border-b bg-white">
        <div className="shell grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          {benefits.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-center gap-4 py-5 md:px-7 first:pl-0"><Icon size={20} /><div><div className="text-sm font-bold">{title}</div><div className="text-xs text-[var(--muted)]">{body}</div></div></div>
          ))}
        </div>
      </section>

      <section className="shell py-16 md:py-24">
        <div className="mb-8 flex items-end justify-between gap-4"><div><p className="eyebrow text-[var(--accent)]">{t.collectionLabel}</p><h2 className="mt-2 text-3xl font-bold md:text-4xl">{t.featured}</h2></div><Link href="/shop" className="hidden items-center gap-2 text-sm font-bold md:flex">{t.viewAll}<ArrowRight size={16} /></Link></div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-6">{products.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}</div>
      </section>

      <section id="approach" className="bg-[#e8e9e3] py-16 md:py-24">
        <div className="shell grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[6px]"><Image src="https://images.unsplash.com/photo-1517404215738-15263e9f9178?auto=format&fit=crop&w=1400&q=88" alt="Product materials and design" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /></div>
          <div className="max-w-lg"><p className="eyebrow text-[var(--green)]">{t.approachLabel}</p><h2 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">{t.approachTitle}</h2><p className="mt-5 leading-7 text-[var(--muted)]">{t.approachBody}</p><Link href="/shop" className="button-primary mt-7">{t.exploreSystem}<ArrowRight size={17} /></Link></div>
        </div>
      </section>

      <section className="shell py-16 md:py-24"><div className="grid gap-6 border-y py-10 md:grid-cols-[1.2fr_.8fr] md:items-center"><div><p className="eyebrow text-[var(--accent)]">{t.creatorNetwork}</p><h2 className="mt-2 text-3xl font-bold">{t.creatorCtaTitle}</h2><p className="mt-3 max-w-xl text-[var(--muted)]">{t.creatorCtaBody}</p></div><div className="md:text-right"><Link href="/creators" className="button-secondary">{t.creatorCtaButton}<ArrowRight size={16} /></Link></div></div></section>
    </>
  );
}
