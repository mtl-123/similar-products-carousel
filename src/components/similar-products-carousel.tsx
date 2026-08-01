"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale, Product } from "@/lib/types";
import { copy, formatCurrency, localizeCategory, localizeProduct } from "@/lib/i18n";

export function SimilarProductsCarousel({ products, locale }: { products: Product[]; locale: Locale }) {
  const t = copy[locale];
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(products.length > 1);

  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollBack(track.scrollLeft > 4);
    setCanScrollForward(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const frame = window.requestAnimationFrame(updateControls);
    const observer = new ResizeObserver(updateControls);
    observer.observe(track);
    track.addEventListener("scroll", updateControls, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      track.removeEventListener("scroll", updateControls);
    };
  }, [updateControls]);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(240, track.clientWidth * 0.82), behavior: "smooth" });
  }

  return (
    <section className="border-t bg-white" data-testid="similar-products">
      <div className="shell py-12 md:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold md:text-3xl">{t.similarItems}</h2>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/shop" className="mr-1 text-sm font-semibold underline underline-offset-4 hover:text-[var(--accent)]">{t.viewAll}</Link>
            <button type="button" title={t.previousItems} aria-label={t.previousItems} disabled={!canScrollBack} onClick={() => move(-1)} className="flex size-10 items-center justify-center rounded-full border bg-white disabled:cursor-not-allowed disabled:opacity-30">
              <ChevronLeft size={20} />
            </button>
            <button type="button" title={t.nextItems} aria-label={t.nextItems} disabled={!canScrollForward} onClick={() => move(1)} className="flex size-10 items-center justify-center rounded-full border bg-white disabled:cursor-not-allowed disabled:opacity-30">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div ref={trackRef} className="-mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="similar-products-track">
          {products.map((product) => {
            const text = localizeProduct(product, locale);
            return (
              <article key={product.id} className="w-[78%] flex-none snap-start sm:w-[42%] lg:w-[calc((100%-3rem)/4)]" data-related-product-id={product.id}>
                <Link href={`/product/${product.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-[6px] bg-[#ecece8]">
                    <Image src={product.image} alt={text.name} fill sizes="(max-width: 640px) 78vw, (max-width: 1024px) 42vw, 300px" className="object-cover transition duration-500 group-hover:scale-[1.035]" />
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
