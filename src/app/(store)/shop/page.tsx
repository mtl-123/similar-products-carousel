import { getProducts } from "@/lib/db";
import { copy, localizeCategory } from "@/lib/i18n";
import { getStoreLocale } from "@/lib/store-context";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const locale = await getStoreLocale();
  const t = copy[locale];
  const category = (await searchParams).category;
  const all = getProducts({ activeOnly: true });
  const products = typeof category === "string" ? all.filter((product) => product.category === category) : all;
  const categories = [...new Set(all.map((product) => product.category))];
  return (
    <div className="shell py-10 md:py-16">
      <div className="flex flex-col gap-7 border-b pb-8 md:flex-row md:items-end md:justify-between"><div><p className="eyebrow text-[var(--accent)]">{t.shopCollection}</p><h1 className="mt-2 text-4xl font-bold md:text-6xl">{t.shopTitle}</h1><p className="mt-3 text-[var(--muted)]">{products.length} {t.products} · USD</p></div><div className="flex flex-wrap gap-2"><a href="/shop" className={`button-secondary ${!category ? "border-black bg-black text-white" : ""}`}>{t.all}</a>{categories.map((item) => <a key={item} href={`/shop?category=${encodeURIComponent(item)}`} className={`button-secondary ${category === item ? "border-black bg-black text-white" : ""}`}>{localizeCategory(item, locale)}</a>)}</div></div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-9 py-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-7">{products.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}</div>
    </div>
  );
}
