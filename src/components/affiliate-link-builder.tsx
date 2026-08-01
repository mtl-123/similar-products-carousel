"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { backofficeCopy } from "@/lib/backoffice-i18n";
import type { Locale } from "@/lib/types";

export function AffiliateLinkBuilder({ baseUrl, code, discountRate, locale, products }: {
  baseUrl: string;
  code: string;
  discountRate: number;
  locale: Locale;
  products: Array<{ slug: string; name: string }>;
}) {
  const t = backofficeCopy[locale];
  const [destination, setDestination] = useState(products[0] ? `/product/${products[0].slug}` : "/");
  const [campaign, setCampaign] = useState("");
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const link = useMemo(() => {
    const parameters = new URLSearchParams({ to: destination });
    if (campaign.trim()) parameters.set("campaign", campaign.trim());
    return `${baseUrl}/r/${code}?${parameters.toString()}`;
  }, [baseUrl, campaign, code, destination]);

  async function copyValue(value: string, kind: "link" | "code") {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">{t.linkDestination}</span>
          <select className="field" value={destination} onChange={(event) => setDestination(event.target.value)} data-testid="affiliate-destination">
            {products.map((product) => <option key={product.slug} value={`/product/${product.slug}`}>{product.name}</option>)}
            <option value="/">{t.storefrontHome}</option>
            <option value="/shop">{t.fullCatalog}</option>
          </select>
        </label>
        <label>
          <span className="label">{t.campaignTag}</span>
          <input className="field font-mono" value={campaign} onChange={(event) => setCampaign(event.target.value)} placeholder={t.campaignPlaceholder} data-testid="affiliate-campaign" />
        </label>
      </div>

      <div className="mt-5">
        <span className="label">{t.generatedLink}</span>
        <div className="flex gap-2">
          <input readOnly value={link} className="field min-w-0 font-mono text-xs" data-testid="affiliate-link" />
          <button type="button" title={t.copyLink} onClick={() => void copyValue(link, "link")} className="button-secondary shrink-0">{copied === "link" ? <Check size={16} /> : <Copy size={16} />}</button>
          <a href={link} target="_blank" rel="noreferrer" title={t.openLink} className="button-secondary shrink-0"><ExternalLink size={16} /></a>
        </div>
      </div>

      <div className="mt-5 border-t pt-5">
        <span className="label">{t.discountCode} · {discountRate}%</span>
        <div className="flex max-w-sm gap-2">
          <input readOnly value={code} className="field font-mono font-bold" data-testid="affiliate-discount-code" />
          <button type="button" title={t.copyLink} onClick={() => void copyValue(code, "code")} className="button-secondary shrink-0">{copied === "code" ? <Check size={16} /> : <Copy size={16} />}</button>
        </div>
      </div>
    </div>
  );
}
