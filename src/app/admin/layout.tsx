import { requireRole } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { getBackofficeLocale } from "@/lib/store-context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["admin", "support"]);
  const locale = await getBackofficeLocale();
  return <AdminShell locale={locale} session={session}>{children}</AdminShell>;
}
