import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Affiliate, AffiliateClick, Commission, Message, Order, Product, Ticket } from "@/lib/types";

export async function getDatabase() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) throw new Error("Cloudflare D1 binding DB is not configured.");
  return env.DB;
}

export async function getUploadsStore() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.UPLOADS) throw new Error("Cloudflare KV binding UPLOADS is not configured.");
  return env.UPLOADS;
}

async function all<T>(sql: string, ...values: unknown[]) {
  const database = await getDatabase();
  const result = await database.prepare(sql).bind(...values).all<T>();
  return result.results;
}

async function first<T>(sql: string, ...values: unknown[]) {
  const database = await getDatabase();
  return database.prepare(sql).bind(...values).first<T>();
}

export async function getProducts(options: { featured?: boolean; activeOnly?: boolean } = {}) {
  const conditions: string[] = [];
  if (options.featured) conditions.push("featured = 1");
  if (options.activeOnly) conditions.push("status = 'active'");
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return all<Product>(`SELECT * FROM products ${where} ORDER BY featured DESC, id DESC`);
}

export function getProduct(slug: string) {
  return first<Product>("SELECT * FROM products WHERE slug = ?", slug);
}

export function getProductById(id: number) {
  return first<Product>("SELECT * FROM products WHERE id = ?", id);
}

export async function getSimilarProducts(product: Product, limit = 10) {
  let configuredIds: number[] = [];
  try {
    const parsed: unknown = JSON.parse(product.related_product_ids || "[]");
    if (Array.isArray(parsed)) {
      configuredIds = parsed.filter((id): id is number => Number.isInteger(id) && id > 0);
    }
  } catch {
    configuredIds = [];
  }

  const candidates = (await getProducts({ activeOnly: true })).filter((candidate) => candidate.id !== product.id);
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const configured = configuredIds.map((id) => candidateById.get(id)).filter((item): item is Product => Boolean(item));
  const configuredSet = new Set(configured.map((item) => item.id));
  const automatic = candidates
    .filter((candidate) => !configuredSet.has(candidate.id))
    .sort((left, right) => Number(right.category === product.category) - Number(left.category === product.category));

  return [...configured, ...automatic].slice(0, Math.max(0, limit));
}

export function getOrders() {
  return all<Order>("SELECT * FROM orders ORDER BY id DESC");
}

export function getAffiliates() {
  return all<Affiliate>("SELECT * FROM affiliates ORDER BY id DESC");
}

export function getAffiliate(code = "MAYA20") {
  return first<Affiliate>("SELECT * FROM affiliates WHERE code = ?", code);
}

export function getAffiliateClicks(affiliateId: number, limit = 100) {
  return all<AffiliateClick>("SELECT * FROM affiliate_clicks WHERE affiliate_id = ? ORDER BY id DESC LIMIT ?", affiliateId, limit);
}

export function getCommissions(affiliateId: number) {
  return all<Commission>(`SELECT commissions.*, orders.order_no
    FROM commissions JOIN orders ON commissions.order_id = orders.id
    WHERE affiliate_id = ? ORDER BY commissions.id DESC`, affiliateId);
}

export function getTickets() {
  return all<Ticket>("SELECT * FROM tickets ORDER BY updated_at DESC");
}

export function getTicket(id: number) {
  return first<Ticket>("SELECT * FROM tickets WHERE id = ?", id);
}

export function getMessages(ticketId: number) {
  return all<Message>("SELECT * FROM messages WHERE ticket_id = ? ORDER BY id", ticketId);
}

export async function getSettings() {
  const rows = await all<{ key: string; value: string }>("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map(({ key, value }) => [key, value]));
}

export async function getDashboardStats() {
  const database = await getDatabase();
  const statements = [
    database.prepare("SELECT COALESCE(SUM(total), 0) AS value FROM orders WHERE status != 'refunded'"),
    database.prepare("SELECT COUNT(*) AS value FROM orders"),
    database.prepare("SELECT COUNT(*) AS value FROM products WHERE status = 'active'"),
    database.prepare("SELECT COUNT(*) AS value FROM products WHERE inventory < 40 AND status = 'active'"),
    database.prepare("SELECT COUNT(*) AS value FROM tickets WHERE status != 'closed'"),
  ];
  const [revenue, orders, products, lowStock, openTickets] = await database.batch<{ value: number }>(statements);
  return {
    revenue: revenue.results[0]?.value ?? 0,
    orders: orders.results[0]?.value ?? 0,
    products: products.results[0]?.value ?? 0,
    lowStock: lowStock.results[0]?.value ?? 0,
    openTickets: openTickets.results[0]?.value ?? 0,
  };
}
