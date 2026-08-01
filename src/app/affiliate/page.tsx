import { BadgeDollarSign, MousePointerClick, ShoppingBag, TrendingUp, WalletCards } from "lucide-react";
import { headers } from "next/headers";
import { requireRole } from "@/lib/auth";
import { backofficeCopy } from "@/lib/backoffice-i18n";
import { getAffiliate, getCommissions, getProducts } from "@/lib/db";
import { formatCurrency, localizeProduct } from "@/lib/i18n";
import { getBackofficeLocale } from "@/lib/store-context";
import { AffiliateLinkBuilder } from "@/components/affiliate-link-builder";
import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";

export const dynamic = "force-dynamic";

export default async function AffiliatePage() {
  await requireRole(["affiliate"]);
  const affiliate = getAffiliate();
  if (!affiliate) return null;
  const commissions = getCommissions(affiliate.id);
  const conversionRate = affiliate.clicks ? (affiliate.conversions / affiliate.clicks) * 100 : 0;
  const locale = getBackofficeLocale();
  const t = backofficeCopy[locale];
  const products = getProducts({ activeOnly: true }).map((product) => ({ slug: product.slug, name: localizeProduct(product, locale).name }));
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "127.0.0.1:9400";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("127.0.0.1") || host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="shell py-8 md:py-12">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs font-semibold text-[var(--muted)]">{t.creatorId} · {affiliate.code}</p><h1 className="mt-1 text-3xl font-bold">{t.yourPerformance}</h1></div>
        <div className="flex gap-5 text-sm text-[var(--muted)]"><span>{t.commissionRate} <strong className="text-black">{affiliate.commission_rate}%</strong></span><span>{t.discountRate} <strong className="text-black">{affiliate.discount_rate}%</strong></span></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={t.linkClicks} value={affiliate.clicks.toLocaleString()} detail={t.lastThirtyDays} icon={MousePointerClick} />
        <MetricCard label={t.attributedOrders} value={String(affiliate.conversions)} detail={`${conversionRate.toFixed(2)}% ${t.conversion}`} icon={ShoppingBag} />
        <MetricCard label={t.revenueGenerated} value={formatCurrency(affiliate.revenue)} detail={t.netAttributedSales} icon={TrendingUp} tone="green" />
        <MetricCard label={t.availablePayout} value={formatCurrency(affiliate.available_commission)} detail={`${formatCurrency(affiliate.pending_commission)} ${t.pending}`} icon={WalletCards} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section id="links" className="panel p-5">
          <h2 className="text-sm font-bold">{t.promotionLinks}</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">{t.campaignHelp}</p>
          <div className="mt-5"><AffiliateLinkBuilder baseUrl={baseUrl} code={affiliate.code} discountRate={affiliate.discount_rate} locale={locale} products={products} /></div>
        </section>

        <section id="payouts" className="panel p-5">
          <div className="flex items-center gap-3"><BadgeDollarSign size={20} /><h2 className="text-sm font-bold">{t.payoutBalance}</h2></div>
          <div className="mt-6 text-3xl font-bold">{formatCurrency(affiliate.available_commission)}</div>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{t.payoutHelp}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t pt-4 text-sm"><div><div className="text-xs text-[var(--muted)]">{t.paidLifetime}</div><div className="mt-1 font-bold">{formatCurrency(affiliate.paid_commission)}</div></div><div><div className="text-xs text-[var(--muted)]">{t.pending}</div><div className="mt-1 font-bold">{formatCurrency(affiliate.pending_commission)}</div></div></div>
        </section>
      </div>

      <section className="panel mt-6 overflow-hidden">
        <div className="border-b px-5 py-4"><h2 className="text-sm font-bold">{t.commissionHistory}</h2></div>
        {commissions.length ? <table className="w-full text-left text-sm"><thead className="bg-[#fafaf8] text-[11px] uppercase text-[var(--muted)]"><tr><th className="px-5 py-3">{t.order}</th><th className="px-4 py-3">{t.date}</th><th className="px-4 py-3">{t.status}</th><th className="px-5 py-3 text-right">{t.commission}</th></tr></thead><tbody className="divide-y">{commissions.map((commission) => <tr key={commission.id}><td className="px-5 py-4 font-bold">{commission.order_no}</td><td className="px-4 py-4">{commission.created_at.slice(0, 10)}</td><td className="px-4 py-4"><StatusPill value={commission.status} locale={locale} /></td><td className="px-5 py-4 text-right font-bold">{formatCurrency(commission.amount)}</td></tr>)}</tbody></table> : <div className="p-8 text-center text-sm text-[var(--muted)]">{t.noCommissions}</div>}
      </section>
    </div>
  );
}
