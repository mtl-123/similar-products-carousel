import { Download, Search } from "lucide-react";
import { updateOrderStatusAction } from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { backofficeCopy, localizePayment } from "@/lib/backoffice-i18n";
import { getOrders } from "@/lib/db";
import { formatCurrency } from "@/lib/i18n";
import { getBackofficeLocale } from "@/lib/store-context";
import { StatusPill } from "@/components/status-pill";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await requireRole(["admin"]);
  const [orders, locale] = await Promise.all([getOrders(), getBackofficeLocale()]);
  const t = backofficeCopy[locale];

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-6 flex items-end justify-between"><div><p className="text-xs font-semibold text-[var(--muted)]">{t.sales}</p><h1 className="mt-1 text-2xl font-bold">{t.orders}</h1></div><button className="button-secondary"><Download size={16} />{t.export}</button></div>
      <div className="panel overflow-hidden">
        <div className="flex gap-3 border-b p-4"><div className="relative max-w-sm flex-1"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input className="field pl-9" placeholder={t.searchOrders} /></div></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-[#fafaf8] text-[11px] uppercase text-[var(--muted)]"><tr><th className="px-5 py-3">{t.order}</th><th className="px-4 py-3">{t.customer}</th><th className="px-4 py-3">{t.destination}</th><th className="px-4 py-3">{t.payment}</th><th className="px-4 py-3">{t.attribution}</th><th className="px-4 py-3">{t.total}</th><th className="px-5 py-3">{t.status}</th></tr></thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} data-order-no={order.order_no}>
                  <td className="px-5 py-4"><div className="font-bold">{order.order_no}</div><div className="text-xs text-[var(--muted)]">{order.created_at.slice(0, 10)}</div></td>
                  <td className="px-4 py-4"><div className="font-semibold">{order.customer_name}</div><div className="text-xs text-[var(--muted)]">{order.customer_email}</div></td>
                  <td className="px-4 py-4">{order.shipping_address}</td>
                  <td className="px-4 py-4">{localizePayment(order.payment_method, locale)}</td>
                  <td className="px-4 py-4"><div>{order.affiliate_code || t.direct}</div>{order.affiliate_campaign && <div className="mt-1 font-mono text-[10px] text-[var(--muted)]">{order.affiliate_campaign}</div>}</td>
                  <td className="px-4 py-4"><div className="font-bold">{formatCurrency(order.total)}</div>{order.discount > 0 && <div className="text-xs text-[var(--green)]">-{formatCurrency(order.discount)}</div>}</td>
                  <td className="px-5 py-4">
                    <form action={updateOrderStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={order.id} />
                      <select name="status" defaultValue={order.status} className="field min-h-8 w-32 py-1 text-xs"><option value="processing">{t.processing}</option><option value="on-hold">{t.onHold}</option><option value="shipped">{t.shipped}</option><option value="completed">{t.completed}</option><option value="refunded">{t.refunded}</option></select>
                      <button className="button-secondary min-h-8 px-2 py-1 text-xs">{t.save}</button>
                    </form>
                    <div className="mt-2"><StatusPill value={order.status} locale={locale} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
