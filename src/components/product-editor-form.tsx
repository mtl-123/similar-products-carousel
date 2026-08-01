import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ImagePlus, PackagePlus, Sparkles, SlidersHorizontal } from "lucide-react";
import type { Locale, Product } from "@/lib/types";
import { backofficeCopy } from "@/lib/backoffice-i18n";
import { localizeCategory } from "@/lib/i18n";

interface ProductDetails {
  highlights_en?: string[];
  highlights_zh?: string[];
  specifications_en?: Record<string, string>;
  specifications_zh?: Record<string, string>;
  box_contents_en?: string[];
  box_contents_zh?: string[];
}

function lines(value?: string[]) {
  return value?.join("\n") || "";
}

function specifications(value?: Record<string, string>) {
  return Object.entries(value || {}).map(([key, item]) => `${key}: ${item}`).join("\n");
}

function relatedProductIds(value?: string) {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)) : []);
  } catch {
    return new Set<number>();
  }
}

export function ProductEditorForm({ locale, product, products, action }: {
  locale: Locale;
  product?: Product;
  products: Product[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const t = backofficeCopy[locale];
  const editing = Boolean(product);
  const attributes = product ? JSON.parse(product.attributes) as Record<string, string | string[]> : {};
  const details = product ? JSON.parse(product.details || "{}") as ProductDetails : {};
  const gallery = product ? JSON.parse(product.gallery) as string[] : [];
  const selectedRelatedProducts = relatedProductIds(product?.related_product_ids);
  const recommendationCandidates = products.filter((candidate) => candidate.id !== product?.id);
  const colors = Array.isArray(attributes.color) ? attributes.color.join(", ") : attributes.color || "";
  const sizes = Array.isArray(attributes.size) ? attributes.size.join(", ") : attributes.size || "";

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/products" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
        <ArrowLeft size={16} />{t.backToProducts}
      </Link>
      <div className="mb-7">
        <h1 className="text-2xl font-bold">{editing ? t.editProduct : t.addProduct}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{editing ? t.editProductHelp : t.addProductHelp}</p>
      </div>

      <form action={action} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {product && <input type="hidden" name="id" value={product.id} />}
        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="text-sm font-bold">{t.bilingualContent}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label><span className="label">{t.englishName}</span><input className="field" name="name_en" defaultValue={product?.name_en} required /></label>
              <label><span className="label">{t.chineseName}</span><input className="field" name="name_zh" defaultValue={product?.name_zh} required /></label>
              <label className="sm:col-span-2"><span className="label">{t.englishDescription}</span><textarea className="field min-h-28" name="description_en" defaultValue={product?.description_en} required /></label>
              <label className="sm:col-span-2"><span className="label">{t.chineseDescription}</span><textarea className="field min-h-28" name="description_zh" defaultValue={product?.description_zh} required /></label>
            </div>
          </section>

          <section className="panel p-5">
            <div className="flex items-center gap-3"><ImagePlus size={19} /><h2 className="text-sm font-bold">{t.productMedia}</h2></div>
            {product && (
              <div className="mt-5">
                <span className="label">{t.currentPrimaryImage}</span>
                <div className="relative aspect-[16/9] max-w-sm overflow-hidden rounded-[4px] border bg-[#eeeef0]">
                  <Image src={product.image} alt={product.name_en} fill sizes="384px" className="object-cover" />
                </div>
              </div>
            )}
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="label">{editing ? t.replacePrimaryImageFile : t.primaryImageFile}</span><input className="field file:mr-3 file:border-0 file:bg-transparent file:text-xs file:font-bold" name="image_file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" /></label>
              <label className="sm:col-span-2"><span className="label">{editing ? t.replacePrimaryImageUrl : t.primaryImageUrl}</span><input className="field" name="image" type="url" placeholder="https://images.example.com/product.jpg" /></label>
            </div>

            {gallery.length > 0 && (
              <div className="mt-6">
                <span className="label">{t.currentGallery}</span>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {gallery.map((image, index) => (
                    <label key={`${image}-${index}`} className="relative aspect-square cursor-pointer overflow-hidden rounded-[4px] border bg-[#eeeef0]">
                      <Image src={image} alt="" fill sizes="160px" className="object-cover" />
                      <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/75 px-2 py-2 text-[11px] font-semibold text-white">
                        <input type="checkbox" name="keep_gallery" value={image} defaultChecked />{t.keepImage}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="label">{editing ? t.addGalleryFiles : t.galleryFiles}</span><input className="field file:mr-3 file:border-0 file:bg-transparent file:text-xs file:font-bold" name="gallery_files" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple /></label>
              <label className="sm:col-span-2"><span className="label">{editing ? t.addGalleryUrls : t.galleryUrls}</span><textarea className="field min-h-24 font-mono text-xs" name="gallery_urls" placeholder={'https://images.example.com/front.jpg\nhttps://images.example.com/detail.jpg'} /></label>
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">{t.imageHelp}</p>
          </section>

          <section className="panel p-5">
            <div className="flex items-center gap-3"><SlidersHorizontal size={19} /><h2 className="text-sm font-bold">{t.productAttributes}</h2></div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label><span className="label">{t.colors}</span><input className="field" name="colors" defaultValue={colors} placeholder={locale === "zh" ? "黑色、银色" : "Black, Silver"} /></label>
              <label><span className="label">{t.sizes}</span><input className="field" name="sizes" defaultValue={sizes} placeholder="S, M, L" /></label>
              <label><span className="label">{t.material}</span><input className="field" name="material" defaultValue={typeof attributes.material === "string" ? attributes.material : ""} /></label>
              <label><span className="label">{t.weight}</span><input className="field" name="weight" defaultValue={typeof attributes.weight === "string" ? attributes.weight : ""} placeholder="1.2 lb" /></label>
            </div>
          </section>

          <section className="panel p-5">
            <div className="flex items-center gap-3"><SlidersHorizontal size={19} /><h2 className="text-sm font-bold">{t.productSellingContent}</h2></div>
            <p className="mt-2 text-xs text-[var(--muted)]">{t.productSellingContentHelp}</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label><span className="label">{t.highlightsEnglish}</span><textarea className="field min-h-28" name="highlights_en" defaultValue={lines(details.highlights_en)} /></label>
              <label><span className="label">{t.highlightsChinese}</span><textarea className="field min-h-28" name="highlights_zh" defaultValue={lines(details.highlights_zh)} /></label>
              <label><span className="label">{t.specificationsEnglish}</span><textarea className="field min-h-32 font-mono text-xs" name="specifications_en" defaultValue={specifications(details.specifications_en)} /></label>
              <label><span className="label">{t.specificationsChinese}</span><textarea className="field min-h-32 font-mono text-xs" name="specifications_zh" defaultValue={specifications(details.specifications_zh)} /></label>
              <label><span className="label">{t.boxContentsEnglish}</span><textarea className="field min-h-28" name="box_contents_en" defaultValue={lines(details.box_contents_en)} /></label>
              <label><span className="label">{t.boxContentsChinese}</span><textarea className="field min-h-28" name="box_contents_zh" defaultValue={lines(details.box_contents_zh)} /></label>
            </div>
          </section>

          <section className="panel p-5" data-testid="related-products-editor">
            <div className="flex items-center gap-3"><Sparkles size={19} /><h2 className="text-sm font-bold">{t.relatedProducts}</h2></div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{t.relatedProductsHelp}</p>
            {recommendationCandidates.length > 0 ? (
              <div className="mt-5 grid border-y sm:grid-cols-2 sm:divide-x">
                {recommendationCandidates.map((candidate) => {
                  const candidateName = locale === "zh" ? candidate.name_zh : candidate.name_en;
                  const status = candidate.status === "active" ? t.active : candidate.status === "draft" ? t.draft : t.archived;
                  return (
                    <label key={candidate.id} className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
                      <input type="checkbox" name="related_product_ids" value={candidate.id} defaultChecked={selectedRelatedProducts.has(candidate.id)} className="size-4 shrink-0" />
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-[4px] bg-[#eeeef0]"><Image src={candidate.image} alt="" fill sizes="48px" className="object-cover" /></span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{candidateName}</span>
                        <span className="mt-0.5 block text-xs text-[var(--muted)]">{candidate.sku} · {status}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : <p className="mt-5 text-sm text-[var(--muted)]">{t.noRelatedProducts}</p>}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="panel p-5">
            <div className="flex items-center gap-3"><PackagePlus size={19} /><h2 className="text-sm font-bold">{t.commerce}</h2></div>
            <div className="mt-5 grid gap-4">
              <label><span className="label">SKU</span><input className="field" name="sku" defaultValue={product?.sku} required /></label>
              <label><span className="label">{t.urlSlug}</span><input className="field" name="slug" pattern="[a-z0-9-]+" defaultValue={product?.slug} required /></label>
              <div className="grid grid-cols-2 gap-3">
                <label><span className="label">{t.priceUsd}</span><input className="field" name="price" type="number" min="0" step="0.01" defaultValue={product?.price} required /></label>
                <label><span className="label">{t.compareAt}</span><input className="field" name="compare_at" type="number" min="0" step="0.01" defaultValue={product?.compare_at ?? undefined} /></label>
              </div>
              <label><span className="label">{t.inventory}</span><input className="field" name="inventory" type="number" min="0" defaultValue={product?.inventory} required /></label>
              <label><span className="label">{t.category}</span><select className="field" name="category" defaultValue={product?.category || "Electronics"}>{["Electronics", "Travel", "Bags", "Everyday", "Accessories"].map((category) => <option key={category} value={category}>{localizeCategory(category, locale)}</option>)}</select></label>
              <label><span className="label">{t.status}</span><select className="field" name="status" defaultValue={product?.status || "active"}><option value="active">{t.active}</option><option value="draft">{t.draft}</option><option value="archived">{t.archived}</option></select></label>
              <label className="flex items-center gap-3 rounded-[4px] border p-3 text-sm font-semibold"><input name="featured" type="checkbox" defaultChecked={Boolean(product?.featured)} />{t.featureStorefront}</label>
            </div>
          </section>
          <button className="button-primary w-full">{editing ? t.saveProduct : t.publishProduct}</button>
        </aside>
      </form>
    </div>
  );
}
