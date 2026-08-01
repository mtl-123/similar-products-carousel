import "server-only";

import { cookies } from "next/headers";
import { getSettings } from "@/lib/db";
import type { Locale } from "@/lib/types";

export async function getStoreContext() {
  const settings = await getSettings();
  const cookieStore = await cookies();
  const selectedLocale = cookieStore.get("northstar_locale")?.value;
  const selectedRevision = cookieStore.get("northstar_locale_revision")?.value;
  const defaultLocale: Locale = settings.default_locale === "zh" ? "zh" : "en";
  const hasCurrentOverride = selectedRevision === settings.locale_revision && (selectedLocale === "en" || selectedLocale === "zh");
  const locale: Locale = hasCurrentOverride ? selectedLocale as Locale : defaultLocale;

  return {
    locale,
    settings,
    storeName: settings.store_name?.trim() || "Northstar Supply",
  };
}

export async function getStoreLocale() {
  return (await getStoreContext()).locale;
}

export async function getBackofficeLocale() {
  return ((await getSettings()).default_locale === "zh" ? "zh" : "en") as Locale;
}
