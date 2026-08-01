import Image from "next/image";
import Link from "next/link";
import type { Locale, Product } from "@/lib/types";
import { copy, formatCurrency, localizeCategory, localizeProduct } from "@/lib/i18n";
import { AddToCartButton } from "@/components/add-to-cart";

export function ProductCard({ product, locale }: { product: Product; locale: Locale }) {
  const text = localizeProduct(product, locale);
  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[5px] bg-[#ecece8]">
        <Link href={`/product/${product.slug}`}>
          <Image src={product.image} alt={text.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" />
        </Link>
        {product.compare_at && <span className="absolute left-3 top-3 rounded-[3px] bg-[var(--accent)] px-2 py-1 text-[10px] font-bold uppercase text-white">{copy[locale].sale}</span>}
        <div className="absolute bottom-3 right-3 translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100">
          <AddToCartButton compact label={copy[locale].addToCart} product={{ id: product.id, slug: product.slug, name: text.name, image: product.image, price: product.price }} />
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0"><Link href={`/product/${product.slug}`} className="block truncate text-sm font-semibold hover:text-[var(--accent)]">{text.name}</Link><span className="text-xs text-[var(--muted)]">{localizeCategory(product.category, locale)}</span></div>
        <div className="shrink-0 text-right text-sm font-semibold">{formatCurrency(product.price)}{product.compare_at && <div className="text-xs font-normal text-gray-400 line-through">{formatCurrency(product.compare_at)}</div>}</div>
      </div>
    </article>
  );
}
