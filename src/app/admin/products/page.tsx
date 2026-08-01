import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus, Search } from "lucide-react";
import { toggleProductStatusAction } from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { getProducts } from "@/lib/db";
import { backofficeCopy } from "@/lib/backoffice-i18n";
import { formatCurrency, localizeCategory } from "@/lib/i18n";
import { getBackofficeLocale } from "@/lib/store-context";
import { StatusPill } from "@/components/status-pill";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await requireRole(["admin"]);
  const products = getProducts();
  const locale = getBackofficeLocale();
  const t = backofficeCopy[locale];

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><p className="text-xs font-semibold text-[var(--muted)]">{t.catalog}</p><h1 className="mt-1 text-2xl font-bold">{t.products}</h1></div>
        <Link href="/admin/products/new" className="button-primary"><Plus size={16} />{t.addProduct}</Link>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center gap-3 border-b p-4">
          <div className="relative max-w-sm flex-1"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input className="field pl-9" placeholder={t.searchProducts} /></div>
          <select className="field max-w-36"><option>{t.allStatuses}</option><option>{t.active}</option><option>{t.draft}</option><option>{t.archived}</option></select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-[#fafaf8] text-[11px] uppercase text-[var(--muted)]">
              <tr><th className="px-5 py-3">{t.product}</th><th className="px-4 py-3">{t.status}</th><th className="px-4 py-3">{t.inventory}</th><th className="px-4 py-3">{t.category}</th><th className="px-4 py-3">{t.price}</th><th className="px-4 py-3">SKU</th><th className="px-5 py-3 text-right">{t.actions}</th></tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => {
                const toggleLabel = product.status === "active" ? t.unpublish : t.publish;
                return (
                  <tr key={product.id} className="hover:bg-[#fafaf8]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 overflow-hidden rounded-[4px] bg-gray-100"><Image src={product.image} alt="" fill sizes="48px" className="object-cover" /></div>
                        <div><div className="font-bold">{locale === "zh" ? product.name_zh : product.name_en}</div><div className="text-xs text-[var(--muted)]">{locale === "zh" ? product.name_en : product.name_zh}</div></div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusPill value={product.status} locale={locale} /></td>
                    <td className={`px-4 py-3 font-semibold ${product.inventory < 40 ? "text-[var(--accent)]" : ""}`}>{product.inventory}</td>
                    <td className="px-4 py-3">{localizeCategory(product.category, locale)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product.id}/edit`} className="inline-flex h-9 items-center gap-2 rounded-[4px] border bg-white px-3 text-xs font-bold hover:bg-gray-50"><Pencil size={14} />{t.edit}</Link>
                        <form action={toggleProductStatusAction}>
                          <input type="hidden" name="id" value={product.id} />
                          <button className={`inline-flex h-9 items-center gap-2 rounded-[4px] border px-3 text-xs font-bold ${product.status === "active" ? "border-[#e3b2ac] bg-[#fff7f5] text-[var(--accent-dark)] hover:bg-[#ffede9]" : "bg-white text-[var(--green)] hover:bg-gray-50"}`}>
                            {product.status === "active" ? <EyeOff size={14} /> : <Eye size={14} />}{toggleLabel}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
