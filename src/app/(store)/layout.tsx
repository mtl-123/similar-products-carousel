import { StoreHeader } from "@/components/store-header";
import { StoreFooter } from "@/components/store-footer";
import { StoreLocaleProvider } from "@/components/store-locale-provider";
import { getStoreContext } from "@/lib/store-context";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { locale, storeName } = await getStoreContext();
  return <StoreLocaleProvider locale={locale}><StoreHeader locale={locale} storeName={storeName} /><main className="flex-1">{children}</main><StoreFooter locale={locale} storeName={storeName} /></StoreLocaleProvider>;
}
