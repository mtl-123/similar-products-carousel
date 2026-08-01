import Link from "next/link";
import { ArrowRight, BadgeDollarSign, BarChart3, Link2, WalletCards } from "lucide-react";
import { copy } from "@/lib/i18n";
import { getStoreLocale } from "@/lib/store-context";

export default async function CreatorsPage() {
  const locale = await getStoreLocale();
  const t = copy[locale];
  const features = [
    { icon: Link2, title: t.trackableLinks, body: t.trackableLinksBody },
    { icon: BarChart3, title: t.livePerformance, body: t.livePerformanceBody },
    { icon: BadgeDollarSign, title: t.clearCommission, body: t.clearCommissionBody },
    { icon: WalletCards, title: t.payoutHistory, body: t.payoutHistoryBody },
  ];

  return <>
    <section className="bg-[#191b1a] py-20 text-white md:py-28">
      <div className="shell">
        <p className="eyebrow text-[#f3c94c]">{t.creatorEyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[1.02] md:text-7xl">{t.creatorTitle}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">{t.creatorBody}</p>
        <Link href="/login?role=affiliate" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-[4px] bg-white px-5 text-sm font-bold text-black hover:bg-[var(--yellow)]">{t.creatorDemo}<ArrowRight size={17} /></Link>
      </div>
    </section>
    <section className="shell py-16 md:py-24">
      <div className="grid gap-5 md:grid-cols-4">{features.map(({ icon: Icon, title, body }) => <div key={title} className="panel p-5"><Icon size={22} className="text-[var(--accent)]" /><h2 className="mt-5 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p></div>)}</div>
    </section>
  </>;
}
