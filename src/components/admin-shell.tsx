import Link from "next/link";
import { BadgeDollarSign, Boxes, ChevronDown, CircleUserRound, ClipboardList, Headphones, LayoutDashboard, LogOut, Settings2, Store } from "lucide-react";
import { logoutAction } from "@/app/actions";
import type { Role } from "@/lib/auth";
import type { Locale } from "@/lib/types";
import { backofficeCopy, localizeRole } from "@/lib/backoffice-i18n";

const nav = [
  { href: "/admin", labelKey: "overview", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/admin/products", labelKey: "products", icon: Boxes, roles: ["admin"] },
  { href: "/admin/orders", labelKey: "orders", icon: ClipboardList, roles: ["admin"] },
  { href: "/admin/affiliates", labelKey: "creators", icon: BadgeDollarSign, roles: ["admin"] },
  { href: "/admin/inbox", labelKey: "inbox", icon: Headphones, roles: ["admin", "support"] },
  { href: "/admin/settings", labelKey: "settings", icon: Settings2, roles: ["admin"] },
] as const;

export function AdminShell({ children, locale, session }: { children: React.ReactNode; locale: Locale; session: { role: Role; name: string; email: string } }) {
  const t = backofficeCopy[locale];
  return <div className="min-h-screen bg-[#f3f3f0] text-[#191b1a]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[228px] border-r bg-[#191b1a] text-white lg:flex lg:flex-col"><Link href="/admin" className="flex h-16 items-center border-b border-white/10 px-5 text-[17px] font-black uppercase">Northstar<span className="text-[var(--accent)]">.</span></Link><nav className="flex-1 space-y-1 p-3">{nav.filter((item) => (item.roles as readonly string[]).includes(session.role)).map((item) => <Link key={item.href} href={item.href} className="flex h-10 items-center gap-3 rounded-[4px] px-3 text-sm font-semibold text-white/68 hover:bg-white/10 hover:text-white"><item.icon size={18} />{t[item.labelKey]}</Link>)}</nav><div className="border-t border-white/10 p-3"><Link href="/" className="flex h-10 items-center gap-3 rounded-[4px] px-3 text-sm font-semibold text-white/68 hover:bg-white/10 hover:text-white"><Store size={18} />{t.viewStorefront}</Link></div></aside>
    <div className="lg:pl-[228px]"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 md:px-7"><div className="flex items-center gap-3"><div className="text-sm font-bold lg:hidden">Northstar.</div><span className="hidden text-xs text-[var(--muted)] sm:block">{t.market} · USD · {localizeRole(session.role, locale)}</span></div><div className="flex items-center gap-2"><CircleUserRound size={19} /><div className="hidden text-left sm:block"><div className="text-xs font-bold">{session.name}</div><div className="text-[10px] text-[var(--muted)]">{session.email}</div></div><ChevronDown size={14} /><form action={logoutAction}><button title={t.signOut} className="ml-2 flex size-9 items-center justify-center rounded-[4px] border hover:bg-gray-50"><LogOut size={16} /></button></form></div></header><main className="p-4 md:p-7">{children}</main></div>
  </div>;
}
