"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/types";

const StoreLocaleContext = createContext<Locale>("en");

export function StoreLocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <StoreLocaleContext.Provider value={locale}>{children}</StoreLocaleContext.Provider>;
}

export function useStoreLocale() {
  return useContext(StoreLocaleContext);
}
