import { BadgeDollarSign, ExternalLink, MousePointerClick, ShoppingBag } from "lucide-react";
import { payoutAffiliateAction, updateAffiliateTermsAction } from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { backofficeCopy } from "@/lib/backoffice-i18n";
import { getAffiliates } from "@/lib/db";
import { formatCurrency } from "@/lib/i18n";
import { getBackofficeLocale } from "@/lib/store-context";
import { StatusPill } from "@/components/status-pill";

export const dynamic = "force-dynamic";

export default async function AffiliatesPage() {
  await requireRole(["admin"]);
  const [affiliates, locale] = await Promise.all([getAffiliates(), getBackofficeLocale()]);
  const t = backofficeCopy[locale];

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-6"><p className="text-xs font-semibold text-[var(--muted)]">{t.partnerships}</p><h1 className="mt-1 text-2xl font-bold">{t.creatorNetwork}</h1></div>
      <div className="panel overflow-hidden">
        <div className="hidden bg-[#fafaf8] px-5 py-3 text-[11px] font-bold uppercase text-[var(--muted)] lg:grid lg:grid-cols-[1fr_120px_130px_250px_180px_150px]">
          <span>{t.creator}</span><span>{t.traffic}</span><span>{t.orders}</span><span>{t.terms}</span><span>{t.commission}</span><span>{t.action}</span>
        </div>
        {affiliates.map((affiliate) => (
          <div key={affiliate.id} data-affiliate-code={affiliate.code} className="grid items-center gap-5 border-t p-5 lg:grid-cols-[1fr_120px_130px_250px_180px_150px]">
            <div><div className="flex items-center gap-2"><span className="font-bold">{affiliate.name}</span><StatusPill value={affiliate.status} locale={locale} /></div><div className="mt-1 text-xs text-[var(--muted)]">{affiliate.email} · {affiliate.code}</div></div>
            <div><div className="flex items-center gap-2 font-bold"><MousePointerClick size={15} />{affiliate.clicks.toLocaleString()}</div><div className="text-xs text-[var(--muted)]">{t.clicks}</div></div>
            <div><div className="flex items-center gap-2 font-bold"><ShoppingBag size={15} />{affiliate.conversions}</div><div className="text-xs text-[var(--muted)]">{formatCurrency(affiliate.revenue)}</div></div>
            <form action={updateAffiliateTermsAction} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <input type="hidden" name="id" value={affiliate.id} />
              <label><span className="mb-1 block text-[10px] font-bold text-[var(--muted)]">{t.commissionRate}</span><input className="field min-h-9 py-1" name="commission_rate" type="number" min="0" max="100" step="0.1" defaultValue={affiliate.commission_rate} /></label>
              <label><span className="mb-1 block text-[10px] font-bold text-[var(--muted)]">{t.discountRate}</span><input className="field min-h-9 py-1" name="discount_rate" type="number" min="0" max="50" step="0.1" defaultValue={affiliate.discount_rate} /></label>
              <button title={t.save} className="button-secondary min-h-9 px-3 py-1">{t.save}</button>
            </form>
            <div><div className="font-bold text-[var(--green)]">{formatCurrency(affiliate.available_commission)}</div><div className="text-xs text-[var(--muted)]">{formatCurrency(affiliate.pending_commission)} {t.pending}</div></div>
            <form action={payoutAffiliateAction}><input type="hidden" name="id" value={affiliate.id} /><button disabled={affiliate.available_commission <= 0} className="button-secondary w-full disabled:opacity-40"><BadgeDollarSign size={15} />{t.markPaid}</button></form>
          </div>
        ))}
      </div>
      <a href="/r/MAYA20?to=%2Fshop&campaign=admin-test" target="_blank" className="mt-5 inline-flex items-center gap-2 text-sm font-bold">{t.testAttribution}<ExternalLink size={15} /></a>
    </div>
  );
}
