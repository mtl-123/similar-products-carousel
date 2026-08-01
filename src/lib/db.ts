import "server-only";

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { Affiliate, AffiliateClick, Commission, Message, Order, Product, Ticket } from "@/lib/types";

const dataDirectory = process.env.DATA_DIRECTORY
  ? path.resolve(process.env.DATA_DIRECTORY)
  : path.join(process.cwd(), ".data");
fs.mkdirSync(dataDirectory, { recursive: true });

const globalForDb = globalThis as unknown as { northstarDb?: Database.Database };

export const db =
  globalForDb.northstarDb ??
  new Database(path.join(dataDirectory, "northstar.db"));

if (process.env.NODE_ENV !== "production") globalForDb.northstarDb = db;

db.pragma("busy_timeout = 10000");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_zh TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_zh TEXT NOT NULL,
    price REAL NOT NULL,
    compare_at REAL,
    inventory INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    category TEXT NOT NULL,
    image TEXT NOT NULL,
    gallery TEXT NOT NULL DEFAULT '[]',
    attributes TEXT NOT NULL DEFAULT '{}',
    details TEXT NOT NULL DEFAULT '{}',
    related_product_ids TEXT NOT NULL DEFAULT '[]',
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    total REAL NOT NULL,
    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    shipping REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing',
    payment_method TEXT NOT NULL,
    affiliate_code TEXT,
    attribution_product_id INTEGER,
    affiliate_campaign TEXT,
    shipping_address TEXT NOT NULL,
    items TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS affiliates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    commission_rate REAL NOT NULL DEFAULT 20,
    discount_rate REAL NOT NULL DEFAULT 10,
    clicks INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    revenue REAL NOT NULL DEFAULT 0,
    pending_commission REAL NOT NULL DEFAULT 0,
    available_commission REAL NOT NULL DEFAULT 0,
    paid_commission REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS commissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    affiliate_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    base_amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    reversed_from_status TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
  CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    affiliate_id INTEGER NOT NULL,
    destination TEXT NOT NULL,
    product_id INTEGER,
    campaign TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    channel TEXT NOT NULL DEFAULT 'email',
    priority TEXT NOT NULL DEFAULT 'normal',
    last_message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    sender TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

function addColumnIfMissing(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

addColumnIfMissing("products", "details", "TEXT NOT NULL DEFAULT '{}'");
addColumnIfMissing("products", "related_product_ids", "TEXT NOT NULL DEFAULT '[]'");
addColumnIfMissing("orders", "subtotal", "REAL NOT NULL DEFAULT 0");
addColumnIfMissing("orders", "discount", "REAL NOT NULL DEFAULT 0");
addColumnIfMissing("orders", "shipping", "REAL NOT NULL DEFAULT 0");
addColumnIfMissing("orders", "attribution_product_id", "INTEGER");
addColumnIfMissing("orders", "affiliate_campaign", "TEXT");
addColumnIfMissing("affiliates", "discount_rate", "REAL NOT NULL DEFAULT 10");
addColumnIfMissing("commissions", "base_amount", "REAL NOT NULL DEFAULT 0");
addColumnIfMissing("commissions", "reversed_from_status", "TEXT");

const productCount = db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO products
      (slug, sku, name_en, name_zh, description_en, description_zh, price, compare_at, inventory, status, category, image, gallery, attributes, featured)
    VALUES
      (@slug, @sku, @name_en, @name_zh, @description_en, @description_zh, @price, @compare_at, @inventory, 'active', @category, @image, @gallery, @attributes, @featured)
  `);
  const products = [
    {
      slug: "voyager-carry-on", sku: "NS-TR-001", name_en: "Voyager Carry-On", name_zh: "远行登机箱",
      description_en: "A quiet, impact-resistant carry-on designed for fast airport movement.", description_zh: "为高效机场出行打造的静音抗冲击登机箱。",
      price: 238, compare_at: 279, inventory: 38, category: "Travel", featured: 1,
      image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=1200&q=88",
      gallery: "[]", attributes: JSON.stringify({ color: ["Graphite", "Silver"], size: "22 in" }),
    },
    {
      slug: "meridian-travel-pack", sku: "NS-BG-002", name_en: "Meridian Travel Pack", name_zh: "子午线旅行背包",
      description_en: "A structured carry system with adaptable storage for work and weekends.", description_zh: "适合通勤与周末出行的模块化收纳背包。",
      price: 149, compare_at: null, inventory: 52, category: "Bags", featured: 1,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=88",
      gallery: "[]", attributes: JSON.stringify({ color: ["Black", "Moss"], volume: "28 L" }),
    },
    {
      slug: "halo-everyday-bottle", sku: "NS-DR-003", name_en: "Halo Everyday Bottle", name_zh: "光环保温水瓶",
      description_en: "Double-wall insulation in a precise silhouette made for daily use.", description_zh: "双层真空保温，简洁轮廓适合日常使用。",
      price: 39, compare_at: 48, inventory: 120, category: "Everyday", featured: 1,
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=88",
      gallery: "[]", attributes: JSON.stringify({ color: ["Steel", "Signal Red"], volume: "24 oz" }),
    },
    {
      slug: "ridge-tech-organizer", sku: "NS-AC-004", name_en: "Ridge Tech Organizer", name_zh: "山脊数码收纳包",
      description_en: "Compact organization for cables, cards and travel essentials.", description_zh: "集中收纳线材、卡片与随身旅行配件。",
      price: 59, compare_at: null, inventory: 74, category: "Accessories", featured: 1,
      image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=88",
      gallery: "[]", attributes: JSON.stringify({ color: ["Black"], material: "Recycled nylon" }),
    },
    {
      slug: "transit-sling", sku: "NS-BG-005", name_en: "Transit Sling", name_zh: "城市通勤斜挎包",
      description_en: "Low-profile crossbody storage with secure quick-access pockets.", description_zh: "轻量贴身设计，兼顾快速取物与安全收纳。",
      price: 79, compare_at: 95, inventory: 31, category: "Bags", featured: 0,
      image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1200&q=88",
      gallery: "[]", attributes: JSON.stringify({ color: ["Black", "Clay"], volume: "6 L" }),
    },
    {
      slug: "nomad-desk-kit", sku: "NS-AC-006", name_en: "Nomad Desk Kit", name_zh: "移动办公套装",
      description_en: "A compact work kit for focused days away from your usual desk.", description_zh: "为移动办公场景准备的精简桌面工具套装。",
      price: 89, compare_at: null, inventory: 46, category: "Everyday", featured: 0,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=88",
      gallery: "[]", attributes: JSON.stringify({ color: ["Graphite"], pieces: 4 }),
    },
  ];
  const transaction = db.transaction(() => products.forEach((product) => insert.run(product)));
  transaction();
}

const affiliateCount = db.prepare("SELECT COUNT(*) AS count FROM affiliates").get() as { count: number };
if (affiliateCount.count === 0) {
  db.prepare(`INSERT INTO affiliates
    (code, name, email, status, commission_rate, clicks, conversions, revenue, pending_commission, available_commission, paid_commission)
    VALUES (?, ?, ?, 'active', 20, 12840, 184, 28640, 684.80, 1243.20, 3800.00)`)
    .run("MAYA20", "Maya Chen", "maya@northstar.demo");
}

const orderCount = db.prepare("SELECT COUNT(*) AS count FROM orders").get() as { count: number };
if (orderCount.count === 0) {
  const orders = [
    ["NS-10428", "Olivia Martin", "olivia@example.com", 238, "processing", "stripe", "MAYA20", "Austin, TX"],
    ["NS-10427", "Ethan Lee", "ethan@example.com", 188, "shipped", "paypal", null, "Seattle, WA"],
    ["NS-10426", "Sofia Garcia", "sofia@example.com", 79, "completed", "stripe", "MAYA20", "Miami, FL"],
    ["NS-10425", "Noah Williams", "noah@example.com", 149, "on-hold", "paypal", null, "Portland, OR"],
  ];
  const insertOrder = db.prepare(`INSERT INTO orders
    (order_no, customer_name, customer_email, total, status, payment_method, affiliate_code, shipping_address, items)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]')`);
  db.transaction(() => orders.forEach((order) => insertOrder.run(...order)))();
}

const commissionCount = db.prepare("SELECT COUNT(*) AS count FROM commissions").get() as { count: number };
if (commissionCount.count === 0) {
  const affiliate = db.prepare("SELECT id FROM affiliates WHERE code = 'MAYA20'").get() as { id: number } | undefined;
  const attributedOrders = db.prepare("SELECT id, total FROM orders WHERE affiliate_code = 'MAYA20'").all() as { id: number; total: number }[];
  if (affiliate) {
    const insertCommission = db.prepare("INSERT INTO commissions (affiliate_id, order_id, amount, status) VALUES (?, ?, ?, ?)");
    attributedOrders.forEach((order, index) => insertCommission.run(affiliate.id, order.id, order.total * 0.2, index === 0 ? "pending" : "approved"));
  }
}

db.exec(`
  UPDATE orders SET subtotal = total WHERE subtotal = 0;
  UPDATE commissions
  SET base_amount = COALESCE((SELECT subtotal FROM orders WHERE orders.id = commissions.order_id), amount)
  WHERE base_amount = 0;
`);

const ticketCount = db.prepare("SELECT COUNT(*) AS count FROM tickets").get() as { count: number };
if (ticketCount.count === 0) {
  const insertTicket = db.prepare(`INSERT INTO tickets
    (customer_name, customer_email, subject, status, channel, priority, last_message)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertTicket.run("Olivia Martin", "olivia@example.com", "Update shipping address", "open", "email", "high", "Can I change the apartment number before dispatch?");
  insertTicket.run("Ethan Lee", "ethan@example.com", "Carry-on wheel question", "pending", "chatwoot", "normal", "Is the replacement wheel covered by warranty?");
  insertTicket.run("Maya Chen", "maya@northstar.demo", "April creator payout", "open", "email", "normal", "Please confirm the payout processing date.");
}

const settingDefaults: Record<string, string> = {
  store_name: "Northstar Supply",
  default_locale: "en",
  locale_revision: "0",
  enabled_locales: "en,zh",
  currency: "USD",
  market: "United States",
  stripe_mode: "sandbox",
  paypal_mode: "sandbox",
  chatwoot_status: "demo",
  email_status: "demo",
  commission_cookie_days: "30",
};
const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
Object.entries(settingDefaults).forEach(([key, value]) => insertSetting.run(key, value));

export function getProducts(options: { featured?: boolean; activeOnly?: boolean } = {}) {
  const conditions: string[] = [];
  if (options.featured) conditions.push("featured = 1");
  if (options.activeOnly) conditions.push("status = 'active'");
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM products ${where} ORDER BY featured DESC, id DESC`).all() as Product[];
}

export function getProduct(slug: string) {
  return db.prepare("SELECT * FROM products WHERE slug = ?").get(slug) as Product | undefined;
}

export function getProductById(id: number) {
  return db.prepare("SELECT * FROM products WHERE id = ?").get(id) as Product | undefined;
}

export function getSimilarProducts(product: Product, limit = 10) {
  let configuredIds: number[] = [];
  try {
    const parsed: unknown = JSON.parse(product.related_product_ids || "[]");
    if (Array.isArray(parsed)) {
      configuredIds = parsed.filter((id): id is number => Number.isInteger(id) && id > 0);
    }
  } catch {
    configuredIds = [];
  }

  const candidates = getProducts({ activeOnly: true }).filter((candidate) => candidate.id !== product.id);
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const configured = configuredIds.map((id) => candidateById.get(id)).filter((item): item is Product => Boolean(item));
  const configuredSet = new Set(configured.map((item) => item.id));
  const automatic = candidates
    .filter((candidate) => !configuredSet.has(candidate.id))
    .sort((left, right) => Number(right.category === product.category) - Number(left.category === product.category));

  return [...configured, ...automatic].slice(0, Math.max(0, limit));
}

export function getOrders() {
  return db.prepare("SELECT * FROM orders ORDER BY id DESC").all() as Order[];
}

export function getAffiliates() {
  return db.prepare("SELECT * FROM affiliates ORDER BY id DESC").all() as Affiliate[];
}

export function getAffiliate(code = "MAYA20") {
  return db.prepare("SELECT * FROM affiliates WHERE code = ?").get(code) as Affiliate | undefined;
}

export function getAffiliateClicks(affiliateId: number, limit = 100) {
  return db.prepare("SELECT * FROM affiliate_clicks WHERE affiliate_id = ? ORDER BY id DESC LIMIT ?").all(affiliateId, limit) as AffiliateClick[];
}

export function getCommissions(affiliateId: number) {
  return db.prepare(`SELECT commissions.*, orders.order_no
    FROM commissions JOIN orders ON commissions.order_id = orders.id
    WHERE affiliate_id = ? ORDER BY commissions.id DESC`).all(affiliateId) as Commission[];
}

export function getTickets() {
  return db.prepare("SELECT * FROM tickets ORDER BY updated_at DESC").all() as Ticket[];
}

export function getTicket(id: number) {
  return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket | undefined;
}

export function getMessages(ticketId: number) {
  return db.prepare("SELECT * FROM messages WHERE ticket_id = ? ORDER BY id").all(ticketId) as Message[];
}

export function getSettings() {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map(({ key, value }) => [key, value]));
}

export function getDashboardStats() {
  const revenue = db.prepare("SELECT COALESCE(SUM(total), 0) AS value FROM orders WHERE status != 'refunded'").get() as { value: number };
  const orders = db.prepare("SELECT COUNT(*) AS value FROM orders").get() as { value: number };
  const products = db.prepare("SELECT COUNT(*) AS value FROM products WHERE status = 'active'").get() as { value: number };
  const lowStock = db.prepare("SELECT COUNT(*) AS value FROM products WHERE inventory < 40 AND status = 'active'").get() as { value: number };
  const openTickets = db.prepare("SELECT COUNT(*) AS value FROM tickets WHERE status != 'closed'").get() as { value: number };
  return { revenue: revenue.value, orders: orders.value, products: products.value, lowStock: lowStock.value, openTickets: openTickets.value };
}
