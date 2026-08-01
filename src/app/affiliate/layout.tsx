import Link from "next/link";
import { BarChart3, Link2, LogOut, Store, WalletCards } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { backofficeCopy } from "@/lib/backoffice-i18n";
import { getBackofficeLocale } from "@/lib/store-context";

export default async function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["affiliate"]);
  const locale = await getBackofficeLocale();
  const t = backofficeCopy[locale];
  return <div className="min-h-screen bg-[#f4f4f0]"><header className="border-b bg-[#191b1a] text-white"><div className="shell flex h-16 items-center justify-between"><Link href="/affiliate" className="font-black uppercase">Northstar<span className="text-[var(--accent)]">.</span> <span className="ml-2 text-xs font-medium text-white/45">{t.creatorCenter}</span></Link><div className="flex items-center gap-4 text-sm"><span className="hidden text-white/65 sm:block">{session.name}</span><Link href="/" title={t.viewStorefront}><Store size={18} /></Link><form action={logoutAction}><button title={t.signOut}><LogOut size={18} /></button></form></div></div></header><nav className="border-b bg-white"><div className="shell flex h-12 items-center gap-6 overflow-auto text-sm font-semibold"><Link href="/affiliate" className="flex items-center gap-2"><BarChart3 size={16} />{t.performance}</Link><a href="#links" className="flex items-center gap-2"><Link2 size={16} />{t.links}</a><a href="#payouts" className="flex items-center gap-2"><WalletCards size={16} />{t.payouts}</a></div></nav><main>{children}</main></div>;
}
