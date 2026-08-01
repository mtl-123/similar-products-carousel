import Link from "next/link";
import { AlertTriangle, Boxes, ChevronRight, CircleDollarSign, ClipboardList, Headphones } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getDashboardStats, getOrders, getProducts, getTickets } from "@/lib/db";
import { backofficeCopy, localizePayment } from "@/lib/backoffice-i18n";
import { formatCurrency } from "@/lib/i18n";
import { getBackofficeLocale } from "@/lib/store-context";
import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireRole(["admin"]);
  const [stats, allOrders, products, allTickets, locale] = await Promise.all([
    getDashboardStats(),
    getOrders(),
    getProducts({ activeOnly: true }),
    getTickets(),
    getBackofficeLocale(),
  ]);
  const orders = allOrders.slice(0, 5);
  const lowStock = products.filter((product) => product.inventory < 40).slice(0, 4);
  const tickets = allTickets.slice(0, 3);
  const t = backofficeCopy[locale];

  return <div className="mx-auto max-w-[1400px]"><div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold text-[var(--muted)]">{t.dashboardDate}</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">{t.greeting}</h1></div><Link href="/admin/products/new" className="button-primary"><Boxes size={16} />{t.addProduct}</Link></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label={t.grossRevenue} value={formatCurrency(stats.revenue)} detail={t.activeOrdersDetail} icon={CircleDollarSign} tone="green" /><MetricCard label={t.orders} value={String(stats.orders)} detail={t.ordersDetail} icon={ClipboardList} /><MetricCard label={t.activeProducts} value={String(stats.products)} detail={t.publishedCatalog} icon={Boxes} /><MetricCard label={t.lowInventory} value={String(stats.lowStock)} detail={t.belowForty} icon={AlertTriangle} tone="red" /><MetricCard label={t.openConversations} value={String(stats.openTickets)} detail={t.emailAndChatwoot} icon={Headphones} /></div><div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.55fr]"><section className="panel overflow-hidden"><div className="flex items-center justify-between border-b px-5 py-4"><h2 className="text-sm font-bold">{t.recentOrders}</h2><Link href="/admin/orders" className="flex items-center gap-1 text-xs font-bold">{t.viewAll}<ChevronRight size={14} /></Link></div><div className="overflow-x-auto"><table className="w-full min-w-[660px] text-left text-sm"><thead className="bg-[#fafaf8] text-[11px] uppercase text-[var(--muted)]"><tr><th className="px-5 py-3">{t.order}</th><th className="px-4 py-3">{t.customer}</th><th className="px-4 py-3">{t.status}</th><th className="px-4 py-3">{t.payment}</th><th className="px-5 py-3 text-right">{t.total}</th></tr></thead><tbody className="divide-y">{orders.map((order) => <tr key={order.id}><td className="px-5 py-4 font-bold">{order.order_no}</td><td className="px-4 py-4"><div className="font-semibold">{order.customer_name}</div><div className="text-xs text-[var(--muted)]">{order.customer_email}</div></td><td className="px-4 py-4"><StatusPill value={order.status} locale={locale} /></td><td className="px-4 py-4">{localizePayment(order.payment_method, locale)}</td><td className="px-5 py-4 text-right font-semibold">{formatCurrency(order.total)}</td></tr>)}</tbody></table></div></section><div className="grid gap-6"><section className="panel"><div className="border-b px-5 py-4"><h2 className="text-sm font-bold">{t.inventoryAttention}</h2></div><div className="divide-y px-5">{lowStock.map((product) => <div key={product.id} className="flex items-center justify-between py-3 text-sm"><div><div className="font-semibold">{locale === "zh" ? product.name_zh : product.name_en}</div><div className="text-xs text-[var(--muted)]">{product.sku}</div></div><span className="font-bold text-[var(--accent)]">{product.inventory}</span></div>)}</div></section><section className="panel"><div className="flex items-center justify-between border-b px-5 py-4"><h2 className="text-sm font-bold">{t.inbox}</h2><Link href="/admin/inbox"><ChevronRight size={16} /></Link></div><div className="divide-y px-5">{tickets.map((ticket) => <Link href={`/admin/inbox?id=${ticket.id}`} key={ticket.id} className="block py-3"><div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-semibold">{ticket.subject}</span><StatusPill value={ticket.status} locale={locale} /></div><p className="mt-1 truncate text-xs text-[var(--muted)]">{ticket.last_message}</p></Link>)}</div></section></div></div></div>;
}
