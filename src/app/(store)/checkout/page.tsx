import { cookies } from "next/headers";
import { CheckoutForm } from "@/components/checkout-form";
import { getAffiliate, getSettings } from "@/lib/db";
import { copy } from "@/lib/i18n";
import { getStoreLocale } from "@/lib/store-context";

export default async function CheckoutPage() {
  const affiliateCode = (await cookies()).get("northstar_affiliate")?.value;
  const affiliate = affiliateCode ? await getAffiliate(affiliateCode) : undefined;
  const locale = await getStoreLocale();
  const t = copy[locale];
  const settings = await getSettings();
  const enabledMethods = [
    ...(settings.stripe_mode === "disabled" ? [] : ["stripe", "apple-pay", "ach"] as const),
    ...(settings.paypal_mode === "disabled" ? [] : ["paypal"] as const),
  ];
  const initialAffiliate = affiliate?.status === "active" ? { code: affiliate.code, discountRate: affiliate.discount_rate } : undefined;
  return <div className="shell py-10 md:py-14"><div className="mb-9 border-b pb-7"><p className="eyebrow text-[var(--accent)]">{t.checkout}</p><h1 className="mt-2 text-4xl font-bold">{t.completeOrder}</h1></div><CheckoutForm initialAffiliate={initialAffiliate} enabledMethods={enabledMethods} /></div>;
}
