"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { Locale, Product } from "@/lib/types";
import { copy, formatCurrency, localizeCategory, localizeProduct } from "@/lib/i18n";

export function SimilarProductsCarousel({ products, locale }: { products: Product[]; locale: Locale }) {
  const t = copy[locale];
  const trackRef = useRef<HTMLDivElement>(null);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-related-product-id]"));
    const origin = cards[0]?.offsetLeft ?? 0;
    const positions = cards.map((card) => card.offsetLeft - origin);
    const current = track.scrollLeft;
    const target = direction > 0
      ? positions.find((position) => position > current + 8) ?? 0
      : [...positions].reverse().find((position) => position < current - 8) ?? track.scrollWidth - track.clientWidth;
    track.scrollTo({ left: target, behavior: "smooth" });
  }

  return (
    <section className="border-t bg-white" data-testid="similar-products">
      <div className="shell min-w-0 py-12 md:py-16">
        <div className="mb-7 flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between" data-testid="similar-products-header">
          <h2 className="text-3xl font-bold md:text-4xl">{t.similarItems}</h2>
          <div className="flex min-w-0 items-center justify-between gap-3 sm:shrink-0 sm:justify-start" data-testid="similar-products-controls">
            <Link href="/shop" className="mr-auto whitespace-nowrap text-base font-bold underline decoration-2 underline-offset-[6px] hover:text-[var(--accent)] sm:mr-2">{t.viewAll}</Link>
            <button type="button" title={t.previousItems} aria-label={t.previousItems} disabled={products.length < 2} onClick={() => move(-1)} className="flex size-14 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-black/15 disabled:hover:bg-white disabled:hover:text-black md:size-16">
              <ChevronLeft size={26} strokeWidth={2.2} />
            </button>
            <button type="button" title={t.nextItems} aria-label={t.nextItems} disabled={products.length < 2} onClick={() => move(1)} className="flex size-14 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-black/15 disabled:hover:bg-white disabled:hover:text-black md:size-16">
              <ChevronRight size={26} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div ref={trackRef} className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="similar-products-track">
          {products.map((product) => {
            const text = localizeProduct(product, locale);
            return (
              <article key={product.id} className="w-[82%] min-w-0 flex-none snap-start sm:w-[calc((100%_-_1rem)/2)] lg:w-[calc((100%_-_3rem)/4)]" data-related-product-id={product.id}>
                <Link href={`/product/${product.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-[6px] bg-[#ecece8]">
                    <Image src={product.image} alt={text.name} fill unoptimized={product.image.startsWith("/api/uploads/")} sizes="(max-width: 640px) 78vw, (max-width: 1024px) 42vw, 300px" className="object-cover transition duration-500 group-hover:scale-[1.035]" />
                    {product.compare_at && <span className="absolute left-3 top-3 rounded-[3px] bg-[var(--accent)] px-2 py-1 text-[10px] font-bold uppercase text-white">{t.sale}</span>}
                  </div>
                  <div className="pt-4">
                    <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 group-hover:text-[var(--accent)]">{text.name}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">{localizeCategory(product.category, locale)}</p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
                      {product.compare_at && <span className="text-xs text-gray-400 line-through">{formatCurrency(product.compare_at)}</span>}
                    </div>
                    <p className={`mt-1 text-xs font-semibold ${product.inventory > 0 ? "text-[var(--green)]" : "text-[var(--accent)]"}`}>{product.inventory > 0 ? t.inStock : t.soldOut}</p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
