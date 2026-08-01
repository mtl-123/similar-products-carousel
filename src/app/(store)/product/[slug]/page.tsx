import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Headphones, PackageCheck, RotateCcw, Truck } from "lucide-react";
import { getProduct, getSimilarProducts } from "@/lib/db";
import { copy, formatCurrency, localizeCategory, localizeProduct } from "@/lib/i18n";
import { getStoreLocale } from "@/lib/store-context";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { SimilarProductsCarousel } from "@/components/similar-products-carousel";

export const dynamic = "force-dynamic";

interface ProductDetails {
  highlights_en?: string[];
  highlights_zh?: string[];
  specifications_en?: Record<string, string>;
  specifications_zh?: Record<string, string>;
  box_contents_en?: string[];
  box_contents_zh?: string[];
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product || product.status !== "active") notFound();

  const locale = await getStoreLocale();
  const t = copy[locale];
  const text = localizeProduct(product, locale);
  const attributes = JSON.parse(product.attributes) as Record<string, string | string[]>;
  const gallery = JSON.parse(product.gallery) as string[];
  const details = JSON.parse(product.details || "{}") as ProductDetails;
  const highlights = details[locale === "zh" ? "highlights_zh" : "highlights_en"] || [];
  const configuredSpecifications = details[locale === "zh" ? "specifications_zh" : "specifications_en"] || {};
  const boxContents = details[locale === "zh" ? "box_contents_zh" : "box_contents_en"] || [];
  const similarProducts = getSimilarProducts(product);
  const attributeLabels: Record<string, string> = {
    color: t.attributeColor,
    size: t.attributeSize,
    material: t.attributeMaterial,
    weight: t.attributeWeight,
    volume: t.attributeVolume,
    pieces: t.attributePieces,
  };
  const specifications = {
    ...Object.fromEntries(Object.entries(attributes).map(([key, value]) => [
      attributeLabels[key] || key,
      Array.isArray(value) ? value.join(" / ") : value,
    ])),
    ...configuredSpecifications,
  };

  return (
    <div>
      <section className="shell py-6 md:py-10">
        <Link href="/shop" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-black">
          <ArrowLeft size={16} />{t.backToShop}
        </Link>

        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)] lg:gap-14 xl:gap-20">
          <ProductGallery key={product.slug} images={[product.image, ...gallery.slice(0, 8)]} name={text.name} imageLabel={t.productImage} />

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase text-[var(--muted)]">
              <span>{localizeCategory(product.category, locale)}</span>
              <span aria-hidden="true">/</span>
              <span>{product.sku}</span>
            </div>
            <h1 className="mt-3 max-w-xl text-3xl font-bold leading-tight md:text-4xl">{text.name}</h1>

            <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2">
              <span className="text-3xl font-bold">{formatCurrency(product.price)}</span>
              {product.compare_at && <span className="pb-1 text-base text-gray-400 line-through">{formatCurrency(product.compare_at)}</span>}
            </div>

            <div className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold ${product.inventory > 0 ? "text-[var(--green)]" : "text-[var(--accent)]"}`}>
              <span className={`size-2 rounded-full ${product.inventory > 0 ? "bg-[var(--green)]" : "bg-[var(--accent)]"}`} />
              {product.inventory > 0 ? `${t.stockAvailable} (${product.inventory})` : t.soldOut}
            </div>

            <p className="mt-5 max-w-xl text-[15px] leading-7 text-[var(--muted)]">{text.description}</p>

            {highlights.length > 0 && (
              <ul className="mt-6 grid gap-3 border-t pt-5">
                {highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3 text-sm leading-6">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--green)]" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            )}

            <ProductPurchasePanel
              inventory={product.inventory}
              labels={{
                addToCart: t.addToCart,
                added: t.added,
                buyNow: t.buyNow,
                decrease: t.decrease,
                increase: t.increase,
                quantity: t.quantity,
                securePayment: t.securePayment,
                soldOut: t.soldOut,
              }}
              product={{ id: product.id, slug: product.slug, name: text.name, image: product.image, price: product.price }}
            />

            <div className="mt-6 grid grid-cols-3 divide-x border-y py-4 text-center text-xs">
              <div className="px-2"><Truck size={18} className="mx-auto mb-2" /><span>{t.deliveryTitle}</span></div>
              <div className="px-2"><RotateCcw size={18} className="mx-auto mb-2" /><span>{t.returnsTitle}</span></div>
              <div className="px-2"><Headphones size={18} className="mx-auto mb-2" /><span>{t.emailSupport}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 border-y bg-white md:mt-14">
        <div className="shell grid gap-8 py-12 md:py-16 lg:grid-cols-[.75fr_1.25fr] lg:gap-20">
          <div>
            <p className="eyebrow text-[var(--accent)]">{t.productOverview}</p>
            <h2 className="mt-3 max-w-sm text-3xl font-bold leading-tight md:text-4xl">{t.productDetails}</h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">{text.description}</p>
        </div>
      </section>

      <section className="shell py-12 md:py-16">
        <div className={`grid gap-12 ${boxContents.length > 0 ? "lg:grid-cols-2 lg:gap-20" : "max-w-3xl"}`}>
          <div>
            <div className="flex items-center gap-3 border-b pb-4">
              <h2 className="text-xl font-bold">{t.specifications}</h2>
              <span className="ml-auto text-xs text-[var(--muted)]">{product.sku}</span>
            </div>
            <dl className="divide-y">
              <div className="grid grid-cols-[minmax(110px,.7fr)_1fr] gap-5 py-4 text-sm">
                <dt className="text-[var(--muted)]">{t.categoryLabel}</dt>
                <dd className="font-semibold">{localizeCategory(product.category, locale)}</dd>
              </div>
              {Object.entries(specifications).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[minmax(110px,.7fr)_1fr] gap-5 py-4 text-sm">
                  <dt className="text-[var(--muted)]">{key}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {boxContents.length > 0 && (
            <div>
              <h2 className="border-b pb-4 text-xl font-bold">{t.whatsIncluded}</h2>
              <ul className="grid gap-4 py-5 sm:grid-cols-2">
                {boxContents.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-semibold">
                    <PackageCheck size={18} className="shrink-0 text-[var(--green)]" />{item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {similarProducts.length > 0 && <SimilarProductsCarousel products={similarProducts} locale={locale} />}

      <section className="border-t bg-[#202321] text-white">
        <div className="shell grid gap-8 py-12 md:grid-cols-3 md:py-14">
          <div><Truck size={22} /><h3 className="mt-4 font-bold">{t.shippingPromise}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-white/65">{t.shippingPromiseBody}</p></div>
          <div><RotateCcw size={22} /><h3 className="mt-4 font-bold">{t.returnPromise}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-white/65">{t.returnPromiseBody}</p></div>
          <div><Headphones size={22} /><h3 className="mt-4 font-bold">{t.supportPromise}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-white/65">{t.supportPromiseBody}</p><Link href="/support" className="mt-4 inline-flex border-b pb-1 text-sm font-semibold hover:text-[#ff8d7e]">{t.contactSupport}</Link></div>
        </div>
      </section>
    </div>
  );
}
