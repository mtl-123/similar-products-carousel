export type Locale = "en" | "zh";

export interface Product {
  id: number;
  slug: string;
  sku: string;
  name_en: string;
  name_zh: string;
  description_en: string;
  description_zh: string;
  price: number;
  compare_at: number | null;
  inventory: number;
  status: "active" | "draft" | "archived";
  category: string;
  image: string;
  gallery: string;
  attributes: string;
  details: string;
  related_product_ids: string;
  featured: number;
  created_at: string;
}

export interface Order {
  id: number;
  order_no: string;
  customer_name: string;
  customer_email: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  status: string;
  payment_method: string;
  affiliate_code: string | null;
  attribution_product_id: number | null;
  affiliate_campaign: string | null;
  shipping_address: string;
  items: string;
  created_at: string;
}

export interface Affiliate {
  id: number;
  code: string;
  name: string;
  email: string;
  status: string;
  commission_rate: number;
  discount_rate: number;
  clicks: number;
  conversions: number;
  revenue: number;
  pending_commission: number;
  available_commission: number;
  paid_commission: number;
  created_at: string;
}

export interface Commission {
  id: number;
  affiliate_id: number;
  order_id: number;
  amount: number;
  base_amount: number;
  status: string;
  reversed_from_status: string | null;
  created_at: string;
  order_no?: string;
}

export interface AffiliateClick {
  id: number;
  affiliate_id: number;
  destination: string;
  product_id: number | null;
  campaign: string | null;
  created_at: string;
}

export interface Ticket {
  id: number;
  customer_name: string;
  customer_email: string;
  subject: string;
  status: string;
  channel: string;
  priority: string;
  last_message: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  ticket_id: number;
  sender: string;
  body: string;
  created_at: string;
}
