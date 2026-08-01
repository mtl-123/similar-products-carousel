import type { LucideIcon } from "lucide-react";

export function MetricCard({ label, value, detail, icon: Icon, tone = "default" }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: "default" | "green" | "red" }) {
  return <div className="panel min-w-0 p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-[var(--muted)]">{label}</span><span className={`flex size-8 items-center justify-center rounded-[4px] ${tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "red" ? "bg-red-50 text-red-700" : "bg-gray-100"}`}><Icon size={16} /></span></div><div className="mt-5 truncate text-2xl font-bold">{value}</div><p className="mt-1 text-xs text-[var(--muted)]">{detail}</p></div>;
}
