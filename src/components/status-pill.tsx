import { localizeStatus } from "@/lib/backoffice-i18n";
import type { Locale } from "@/lib/types";

const colors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  shipped: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  open: "bg-red-50 text-red-700 border-red-200",
  high: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-gray-50 text-gray-600 border-gray-200",
  closed: "bg-gray-50 text-gray-600 border-gray-200",
  refunded: "bg-gray-50 text-gray-600 border-gray-200",
  "on-hold": "bg-orange-50 text-orange-700 border-orange-200",
};

export function StatusPill({ value, locale = "en" }: { value: string; locale?: Locale }) {
  return <span className={`inline-flex min-h-6 items-center rounded-full border px-2 text-[11px] font-bold ${colors[value] || "bg-gray-50 text-gray-600"}`}>{localizeStatus(value, locale)}</span>;
}
