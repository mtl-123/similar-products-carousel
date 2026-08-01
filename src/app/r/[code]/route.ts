import { NextResponse } from "next/server";
import { db, getSettings } from "@/lib/db";

function resolveDestination(requestUrl: URL) {
  const requested = requestUrl.searchParams.get("to") || "/";
  if (requested === "/" || requested === "/shop") {
    return { path: requested, productId: null as number | null };
  }

  const match = requested.match(/^\/product\/([a-z0-9-]+)$/);
  if (!match) return { path: "/", productId: null as number | null };
  const product = db.prepare("SELECT id, slug FROM products WHERE slug = ? AND status = 'active'").get(match[1]) as { id: number; slug: string } | undefined;
  return product
    ? { path: `/product/${product.slug}`, productId: product.id }
    : { path: "/", productId: null as number | null };
}

function resolvePublicOrigin(request: Request, fallback: URL) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  if (!host || !/^[a-zA-Z0-9.:[\]-]+$/.test(host)) return fallback.origin;

  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? forwardedProtocol
    : fallback.protocol.slice(0, -1);
  return `${protocol}://${host}`;
}

export async function GET(request: Request, context: RouteContext<"/r/[code]">) {
  const requestUrl = new URL(request.url);
  const { code: rawCode } = await context.params;
  const code = rawCode.trim().toUpperCase();
  const destination = resolveDestination(requestUrl);
  const publicOrigin = resolvePublicOrigin(request, requestUrl);
  const response = NextResponse.redirect(new URL(destination.path, publicOrigin));
  const affiliate = db.prepare("SELECT id FROM affiliates WHERE code = ? AND status = 'active'").get(code) as { id: number } | undefined;
  if (!affiliate) return response;

  const configuredDays = Number(getSettings().commission_cookie_days);
  const cookieDays = Number.isFinite(configuredDays) ? Math.min(365, Math.max(1, Math.round(configuredDays))) : 30;
  const maxAge = 60 * 60 * 24 * cookieDays;
  const campaignValue = requestUrl.searchParams.get("campaign")?.trim().replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 64);
  const campaign = campaignValue || null;

  db.transaction(() => {
    db.prepare("UPDATE affiliates SET clicks = clicks + 1 WHERE id = ?").run(affiliate.id);
    db.prepare("INSERT INTO affiliate_clicks (affiliate_id, destination, product_id, campaign) VALUES (?, ?, ?, ?)")
      .run(affiliate.id, destination.path, destination.productId, campaign);
  })();

  const cookieOptions = {
    maxAge,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: publicOrigin.startsWith("https://"),
    path: "/",
  };
  response.cookies.set("northstar_affiliate", code, cookieOptions);
  response.cookies.set("northstar_affiliate_product", destination.productId ? String(destination.productId) : "", destination.productId ? cookieOptions : { ...cookieOptions, maxAge: 0 });
  response.cookies.set("northstar_affiliate_campaign", campaign || "", campaign ? cookieOptions : { ...cookieOptions, maxAge: 0 });
  return response;
}
