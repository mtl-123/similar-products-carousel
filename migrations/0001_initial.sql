PRAGMA foreign_keys = ON;

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

INSERT OR IGNORE INTO products
  (slug, sku, name_en, name_zh, description_en, description_zh, price, compare_at, inventory, status, category, image, gallery, attributes, details, related_product_ids, featured)
VALUES
  ('voyager-carry-on', 'NS-TR-001', 'Voyager Carry-On', '远行登机箱', 'A quiet, impact-resistant carry-on designed for fast airport movement.', '为高效机场出行打造的静音抗冲击登机箱。', 238, 279, 38, 'active', 'Travel', 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=1200&q=88', '[]', '{"color":["Graphite","Silver"],"size":"22 in"}', '{}', '[]', 1),
  ('meridian-travel-pack', 'NS-BG-002', 'Meridian Travel Pack', '子午线旅行背包', 'A structured carry system with adaptable storage for work and weekends.', '适合通勤与周末出行的模块化收纳背包。', 149, NULL, 52, 'active', 'Bags', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=88', '[]', '{"color":["Black","Moss"],"volume":"28 L"}', '{}', '[]', 1),
  ('halo-everyday-bottle', 'NS-DR-003', 'Halo Everyday Bottle', '光环保温水瓶', 'Double-wall insulation in a precise silhouette made for daily use.', '双层真空保温，简洁轮廓适合日常使用。', 39, 48, 120, 'active', 'Everyday', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=88', '[]', '{"color":["Steel","Signal Red"],"volume":"24 oz"}', '{}', '[]', 1),
  ('ridge-tech-organizer', 'NS-AC-004', 'Ridge Tech Organizer', '山脊数码收纳包', 'Compact organization for cables, cards and travel essentials.', '集中收纳线材、卡片与随身旅行配件。', 59, NULL, 74, 'active', 'Accessories', 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=88', '[]', '{"color":["Black"],"material":"Recycled nylon"}', '{}', '[]', 1),
  ('transit-sling', 'NS-BG-005', 'Transit Sling', '城市通勤斜挎包', 'Low-profile crossbody storage with secure quick-access pockets.', '轻量贴身设计，兼顾快速取物与安全收纳。', 79, 95, 31, 'active', 'Bags', 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1200&q=88', '[]', '{"color":["Black","Clay"],"volume":"6 L"}', '{}', '[]', 0),
  ('nomad-desk-kit', 'NS-AC-006', 'Nomad Desk Kit', '移动办公套装', 'A compact work kit for focused days away from your usual desk.', '为移动办公场景准备的精简桌面工具套装。', 89, NULL, 46, 'active', 'Everyday', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=88', '[]', '{"color":["Graphite"],"pieces":4}', '{}', '[]', 0);

INSERT OR IGNORE INTO affiliates
  (code, name, email, status, commission_rate, discount_rate, clicks, conversions, revenue, pending_commission, available_commission, paid_commission)
VALUES ('MAYA20', 'Maya Chen', 'maya@northstar.demo', 'active', 20, 10, 12840, 184, 28640, 684.80, 1243.20, 3800.00);

INSERT OR IGNORE INTO orders
  (order_no, customer_name, customer_email, total, subtotal, discount, shipping, status, payment_method, affiliate_code, shipping_address, items)
VALUES
  ('NS-10428', 'Olivia Martin', 'olivia@example.com', 238, 238, 0, 0, 'processing', 'stripe', 'MAYA20', 'Austin, TX', '[]'),
  ('NS-10427', 'Ethan Lee', 'ethan@example.com', 188, 188, 0, 0, 'shipped', 'paypal', NULL, 'Seattle, WA', '[]'),
  ('NS-10426', 'Sofia Garcia', 'sofia@example.com', 79, 79, 0, 0, 'completed', 'stripe', 'MAYA20', 'Miami, FL', '[]'),
  ('NS-10425', 'Noah Williams', 'noah@example.com', 149, 149, 0, 0, 'on-hold', 'paypal', NULL, 'Portland, OR', '[]');

INSERT INTO commissions (affiliate_id, order_id, amount, base_amount, status)
SELECT affiliates.id, orders.id, ROUND(orders.total * 0.2, 2), orders.total,
  CASE WHEN orders.order_no = 'NS-10428' THEN 'pending' ELSE 'approved' END
FROM orders JOIN affiliates ON affiliates.code = orders.affiliate_code
WHERE affiliates.code = 'MAYA20'
  AND NOT EXISTS (SELECT 1 FROM commissions WHERE commissions.order_id = orders.id);

INSERT OR IGNORE INTO tickets
  (id, customer_name, customer_email, subject, status, channel, priority, last_message)
VALUES
  (1, 'Olivia Martin', 'olivia@example.com', 'Update shipping address', 'open', 'email', 'high', 'Can I change the apartment number before dispatch?'),
  (2, 'Ethan Lee', 'ethan@example.com', 'Carry-on wheel question', 'pending', 'chatwoot', 'normal', 'Is the replacement wheel covered by warranty?'),
  (3, 'Maya Chen', 'maya@northstar.demo', 'April creator payout', 'open', 'email', 'normal', 'Please confirm the payout processing date.');

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('store_name', 'Northstar Supply'),
  ('default_locale', 'en'),
  ('locale_revision', '0'),
  ('enabled_locales', 'en,zh'),
  ('currency', 'USD'),
  ('market', 'United States'),
  ('stripe_mode', 'sandbox'),
  ('paypal_mode', 'sandbox'),
  ('chatwoot_status', 'demo'),
  ('email_status', 'demo'),
  ('commission_cookie_days', '30');
