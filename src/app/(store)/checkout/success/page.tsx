import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { CheckoutSuccess } from "@/components/checkout-success";
import { copy } from "@/lib/i18n";
import { getStoreLocale } from "@/lib/store-context";

export default async function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const order = (await searchParams).order;
  const locale = await getStoreLocale();
  const t = copy[locale];
  return <div className="shell flex min-h-[620px] items-center justify-center py-16"><CheckoutSuccess /><div className="max-w-lg text-center"><CheckCircle2 className="mx-auto text-[var(--green)]" size={52} strokeWidth={1.5} /><p className="eyebrow mt-6 text-[var(--green)]">{t.orderReceived}</p><h1 className="mt-2 text-4xl font-bold">{t.thankYou}</h1><p className="mt-4 leading-7 text-[var(--muted)]">{t.orderConfirmedPrefix} <strong className="text-black">{String(order || "")}</strong> {t.orderConfirmedSuffix}</p><Link href="/shop" className="button-primary mt-7">{t.continueShopping}</Link></div></div>;
}
