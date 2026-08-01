"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertRole, clearSession, createSessionValue, setSession, type Role, validateDemoLogin } from "@/lib/auth";
import { backofficeCopy } from "@/lib/backoffice-i18n";
import { db, getSettings } from "@/lib/db";
import type { Locale } from "@/lib/types";

export async function setLocale(formData: FormData) {
  const locale = formData.get("locale") === "zh" ? "zh" : "en";
  const cookieOptions = { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const, path: "/" };
  const cookieStore = await cookies();
  cookieStore.set("northstar_locale", locale, cookieOptions);
  cookieStore.set("northstar_locale_revision", getSettings().locale_revision || "0", cookieOptions);
}

export async function loginAction(_state: { error: string }, formData: FormData) {
  const locale: Locale = formData.get("locale") === "zh" ? "zh" : "en";
  const t = backofficeCopy[locale];
  const role = String(formData.get("role")) as Role;
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  if (!["admin", "affiliate", "support"].includes(role)) return { error: t.unknownRole };
  const account = validateDemoLogin(role, email, password);
  if (!account) return { error: t.invalidCredentials };
  await setSession(createSessionValue(role, account.email, account.name));
  redirect(role === "affiliate" ? "/affiliate" : role === "support" ? "/admin/inbox" : "/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

const productSchema = z.object({
  name_en: z.string().min(2),
  name_zh: z.string().min(1),
  sku: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description_en: z.string().min(10),
  description_zh: z.string().min(5),
  price: z.coerce.number().positive(),
  compare_at: z.coerce.number().nonnegative().optional(),
  inventory: z.coerce.number().int().nonnegative(),
  category: z.string().min(2),
  image: z.union([z.string().url(), z.literal("")]).optional(),
  gallery_urls: z.string().optional(),
  colors: z.string().optional(),
  sizes: z.string().optional(),
  material: z.string().optional(),
  weight: z.string().optional(),
  highlights_en: z.string().optional(),
  highlights_zh: z.string().optional(),
  specifications_en: z.string().optional(),
  specifications_zh: z.string().optional(),
  box_contents_en: z.string().optional(),
  box_contents_zh: z.string().optional(),
  featured: z.string().optional(),
  status: z.enum(["active", "draft", "archived"]),
});

const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);
const maxImageBytes = 2 * 1024 * 1024;

async function storeProductImage(file: File) {
  const extension = imageTypes.get(file.type);
  if (!extension) throw new Error("Images must be JPEG, PNG, WebP or AVIF files.");
  if (file.size > maxImageBytes) throw new Error("Each product image must be 2 MB or smaller.");
  const uploadDirectory = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDirectory, { recursive: true });
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${fileName}`;
}

function parseDetailLines(value = "", maximum = 8) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, maximum);
}

function parseSpecifications(value = "") {
  return Object.fromEntries(parseDetailLines(value, 16).map((line) => {
    const separator = line.indexOf(":");
    if (separator === -1) return [line, ""];
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }).filter(([key]) => key));
}

function parseRelatedProductIds(formData: FormData, currentProductId?: number) {
  const submitted = z.array(z.coerce.number().int().positive()).max(12).parse(formData.getAll("related_product_ids"));
  const uniqueIds = [...new Set(submitted)].filter((id) => id !== currentProductId);
  if (!uniqueIds.length) return [];

  const placeholders = uniqueIds.map(() => "?").join(", ");
  const rows = db.prepare(`SELECT id FROM products WHERE id IN (${placeholders})`).all(...uniqueIds) as Array<{ id: number }>;
  const existingIds = new Set(rows.map((row) => row.id));
  return uniqueIds.filter((id) => existingIds.has(id));
}

type ProductInput = z.infer<typeof productSchema>;

function serializeProductContent(input: ProductInput) {
  const attributes = Object.fromEntries([
    ["color", (input.colors || "").split(/[,，]/).map((value) => value.trim()).filter(Boolean)],
    ["size", (input.sizes || "").split(/[,，]/).map((value) => value.trim()).filter(Boolean)],
    ["material", input.material?.trim() || ""],
    ["weight", input.weight?.trim() || ""],
  ].filter(([, value]) => Array.isArray(value) ? value.length > 0 : Boolean(value)));
  const details = {
    highlights_en: parseDetailLines(input.highlights_en, 4),
    highlights_zh: parseDetailLines(input.highlights_zh, 4),
    specifications_en: parseSpecifications(input.specifications_en),
    specifications_zh: parseSpecifications(input.specifications_zh),
    box_contents_en: parseDetailLines(input.box_contents_en),
    box_contents_zh: parseDetailLines(input.box_contents_zh),
  };
  return { attributes: JSON.stringify(attributes), details: JSON.stringify(details) };
}

async function removeManagedImages(images: string[]) {
  await Promise.all(images.filter((image) => image.startsWith("/uploads/")).map((image) =>
    unlink(path.join(process.cwd(), "public", "uploads", path.basename(image))).catch(() => undefined)
  ));
}

export async function createProductAction(formData: FormData) {
  await assertRole(["admin"]);
  const input = productSchema.parse(Object.fromEntries(formData));
  const galleryUrls = (input.gallery_urls || "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  const parsedGalleryUrls = z.array(z.string().url()).max(8).parse(galleryUrls);
  const primaryFile = formData.get("image_file");
  const galleryFiles = formData.getAll("gallery_files").filter((value): value is File => value instanceof File && value.size > 0);
  const relatedProductIds = parseRelatedProductIds(formData);
  if (galleryFiles.length + parsedGalleryUrls.length > 8) throw new Error("A product can have up to eight gallery images.");

  const storedImages: string[] = [];
  try {
    const primaryImage = primaryFile instanceof File && primaryFile.size > 0
      ? await storeProductImage(primaryFile)
      : input.image;
    if (!primaryImage) throw new Error("Add a primary image file or image URL.");
    if (primaryImage.startsWith("/uploads/")) storedImages.push(primaryImage);

    const uploadedGallery = await Promise.all(galleryFiles.map((file) => storeProductImage(file)));
    storedImages.push(...uploadedGallery);
    const content = serializeProductContent(input);

    db.prepare(`INSERT INTO products
      (slug, sku, name_en, name_zh, description_en, description_zh, price, compare_at, inventory, status, category, image, gallery, attributes, details, related_product_ids, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.slug, input.sku, input.name_en, input.name_zh, input.description_en, input.description_zh, input.price, input.compare_at || null, input.inventory, input.status, input.category, primaryImage, JSON.stringify([...uploadedGallery, ...parsedGalleryUrls]), content.attributes, content.details, JSON.stringify(relatedProductIds), input.featured === "on" ? 1 : 0);
  } catch (error) {
    await removeManagedImages(storedImages);
    throw error;
  }
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function updateProductAction(formData: FormData) {
  await assertRole(["admin"]);
  const id = z.coerce.number().int().positive().parse(formData.get("id"));
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as {
    slug: string;
    image: string;
    gallery: string;
  } | undefined;
  if (!existing) throw new Error("Product not found");

  const input = productSchema.parse(Object.fromEntries(formData));
  const galleryUrls = (input.gallery_urls || "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  const parsedGalleryUrls = z.array(z.string().url()).max(8).parse(galleryUrls);
  const existingGallery = JSON.parse(existing.gallery) as string[];
  const keptGallery = formData.getAll("keep_gallery").map(String).filter((image) => existingGallery.includes(image));
  const primaryFile = formData.get("image_file");
  const galleryFiles = formData.getAll("gallery_files").filter((value): value is File => value instanceof File && value.size > 0);
  const relatedProductIds = parseRelatedProductIds(formData, id);
  if (keptGallery.length + galleryFiles.length + parsedGalleryUrls.length > 8) {
    throw new Error("A product can have up to eight gallery images.");
  }

  const storedImages: string[] = [];
  try {
    const primaryImage = primaryFile instanceof File && primaryFile.size > 0
      ? await storeProductImage(primaryFile)
      : input.image || existing.image;
    if (primaryImage.startsWith("/uploads/") && primaryImage !== existing.image) storedImages.push(primaryImage);
    const uploadedGallery = await Promise.all(galleryFiles.map((file) => storeProductImage(file)));
    storedImages.push(...uploadedGallery);
    const nextGallery = [...keptGallery, ...uploadedGallery, ...parsedGalleryUrls];
    const content = serializeProductContent(input);

    db.prepare(`UPDATE products SET
      slug = ?, sku = ?, name_en = ?, name_zh = ?, description_en = ?, description_zh = ?,
      price = ?, compare_at = ?, inventory = ?, status = ?, category = ?, image = ?,
      gallery = ?, attributes = ?, details = ?, related_product_ids = ?, featured = ?
      WHERE id = ?`)
      .run(input.slug, input.sku, input.name_en, input.name_zh, input.description_en, input.description_zh, input.price, input.compare_at || null, input.inventory, input.status, input.category, primaryImage, JSON.stringify(nextGallery), content.attributes, content.details, JSON.stringify(relatedProductIds), input.featured === "on" ? 1 : 0, id);

    const activeImages = new Set([primaryImage, ...nextGallery]);
    await removeManagedImages([existing.image, ...existingGallery].filter((image) => !activeImages.has(image)));
  } catch (error) {
    await removeManagedImages(storedImages);
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/product/${existing.slug}`);
  revalidatePath(`/product/${input.slug}`);
  redirect("/admin/products");
}

export async function toggleProductStatusAction(formData: FormData) {
  await assertRole(["admin"]);
  const id = z.coerce.number().int().positive().parse(formData.get("id"));
  const product = db.prepare("SELECT slug, status FROM products WHERE id = ?").get(id) as { slug: string; status: string } | undefined;
  if (!product) throw new Error("Product not found");
  const nextStatus = product.status === "active" ? "draft" : "active";
  db.prepare("UPDATE products SET status = ? WHERE id = ?").run(nextStatus, id);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/product/${product.slug}`);
}

export async function updateOrderStatusAction(formData: FormData) {
  await assertRole(["admin"]);
  const id = z.coerce.number().int().parse(formData.get("id"));
  const status = z.enum(["processing", "on-hold", "shipped", "completed", "refunded"]).parse(formData.get("status"));
  const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(id) as { status: string } | undefined;
  if (!order) throw new Error("Order not found");

  db.transaction(() => {
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
    const commission = db.prepare(`SELECT id, affiliate_id, amount, base_amount, status, reversed_from_status
      FROM commissions WHERE order_id = ?`).get(id) as {
        id: number;
        affiliate_id: number;
        amount: number;
        base_amount: number;
        status: string;
        reversed_from_status: string | null;
      } | undefined;
    if (!commission) return;

    let commissionStatus = commission.status;
    if (order.status === "refunded" && status !== "refunded" && commissionStatus === "reversed") {
      const restoredStatus = ["pending", "approved", "paid"].includes(commission.reversed_from_status || "")
        ? commission.reversed_from_status as "pending" | "approved" | "paid"
        : "pending";
      db.prepare("UPDATE commissions SET status = ?, reversed_from_status = NULL WHERE id = ?").run(restoredStatus, commission.id);
      if (restoredStatus === "pending") {
        db.prepare("UPDATE affiliates SET pending_commission = pending_commission + ? WHERE id = ?").run(commission.amount, commission.affiliate_id);
      } else {
        db.prepare("UPDATE affiliates SET available_commission = available_commission + ? WHERE id = ?").run(commission.amount, commission.affiliate_id);
      }
      db.prepare("UPDATE affiliates SET conversions = conversions + 1, revenue = revenue + ? WHERE id = ?").run(commission.base_amount, commission.affiliate_id);
      commissionStatus = restoredStatus;
    }

    if (status === "refunded" && order.status !== "refunded" && commissionStatus !== "reversed") {
      db.prepare("UPDATE commissions SET status = 'reversed', reversed_from_status = ? WHERE id = ?").run(commissionStatus, commission.id);
      if (commissionStatus === "pending") {
        db.prepare("UPDATE affiliates SET pending_commission = pending_commission - ? WHERE id = ?").run(commission.amount, commission.affiliate_id);
      } else {
        db.prepare("UPDATE affiliates SET available_commission = available_commission - ? WHERE id = ?").run(commission.amount, commission.affiliate_id);
      }
      db.prepare("UPDATE affiliates SET conversions = MAX(0, conversions - 1), revenue = revenue - ? WHERE id = ?").run(commission.base_amount, commission.affiliate_id);
      return;
    }

    if (status === "completed" && commissionStatus === "pending") {
      db.prepare("UPDATE commissions SET status = 'approved' WHERE id = ?").run(commission.id);
      db.prepare(`UPDATE affiliates SET
        pending_commission = pending_commission - ?,
        available_commission = available_commission + ?
        WHERE id = ?`).run(commission.amount, commission.amount, commission.affiliate_id);
    }
  })();
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/affiliates");
  revalidatePath("/affiliate");
}

export async function payoutAffiliateAction(formData: FormData) {
  await assertRole(["admin"]);
  const id = z.coerce.number().int().parse(formData.get("id"));
  db.transaction(() => {
    const affiliate = db.prepare("SELECT available_commission FROM affiliates WHERE id = ?").get(id) as { available_commission: number } | undefined;
    if (!affiliate || affiliate.available_commission <= 0) return;
    db.prepare(`UPDATE affiliates SET
      paid_commission = paid_commission + available_commission,
      available_commission = 0
      WHERE id = ?`).run(id);
    db.prepare("UPDATE commissions SET status = 'paid' WHERE affiliate_id = ? AND status = 'approved'").run(id);
  })();
  revalidatePath("/admin/affiliates");
  revalidatePath("/affiliate");
}

export async function updateAffiliateTermsAction(formData: FormData) {
  await assertRole(["admin"]);
  const input = z.object({
    id: z.coerce.number().int().positive(),
    commission_rate: z.coerce.number().min(0).max(100),
    discount_rate: z.coerce.number().min(0).max(50),
  }).parse(Object.fromEntries(formData));
  const result = db.prepare("UPDATE affiliates SET commission_rate = ?, discount_rate = ? WHERE id = ?")
    .run(input.commission_rate, input.discount_rate, input.id);
  if (!result.changes) throw new Error("Affiliate not found");
  revalidatePath("/admin/affiliates");
  revalidatePath("/affiliate");
}

export async function replyTicketAction(formData: FormData) {
  const session = await assertRole(["admin", "support"]);
  const ticketId = z.coerce.number().int().parse(formData.get("ticket_id"));
  const body = z.string().min(2).parse(formData.get("body"));
  db.prepare("INSERT INTO messages (ticket_id, sender, body) VALUES (?, ?, ?)").run(ticketId, session.name, body);
  db.prepare("UPDATE tickets SET last_message = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(body, ticketId);
  revalidatePath("/admin/inbox");
}

export async function updateSettingsAction(formData: FormData) {
  await assertRole(["admin"]);
  const input = z.object({
    store_name: z.string().min(2).max(60),
    default_locale: z.enum(["en", "zh"]),
    stripe_mode: z.enum(["sandbox", "live", "disabled"]),
    paypal_mode: z.enum(["sandbox", "live", "disabled"]),
    chatwoot_status: z.enum(["demo", "configured", "disabled"]),
    email_status: z.enum(["demo", "configured", "disabled"]),
    commission_cookie_days: z.coerce.number().int().min(1).max(365).transform(String),
  }).parse(Object.fromEntries(formData));
  const upsert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  db.transaction(() => {
    Object.entries(input).forEach(([key, value]) => upsert.run(key, value));
    upsert.run("locale_revision", randomUUID());
  })();
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

export async function createTicketAction(formData: FormData) {
  const input = z.object({
    customer_name: z.string().min(2),
    customer_email: z.string().email(),
    subject: z.string().min(3),
    message: z.string().min(10),
  }).parse(Object.fromEntries(formData));
  db.prepare(`INSERT INTO tickets (customer_name, customer_email, subject, channel, priority, last_message)
    VALUES (?, ?, ?, 'web', 'normal', ?)`)
    .run(input.customer_name, input.customer_email, input.subject, input.message);
  redirect("/support?sent=1");
}

export async function placeOrderAction(formData: FormData) {
  const input = z.object({
    customer_name: z.string().min(2),
    customer_email: z.string().email(),
    shipping_address: z.string().min(10),
    payment_method: z.enum(["stripe", "paypal", "apple-pay", "ach"]),
    affiliate_code: z.string().trim().max(40).optional(),
    items: z.string(),
  }).parse(Object.fromEntries(formData));
  const settings = getSettings();
  const stripeMethods = new Set(["stripe", "apple-pay", "ach"]);
  if ((stripeMethods.has(input.payment_method) && settings.stripe_mode === "disabled") || (input.payment_method === "paypal" && settings.paypal_mode === "disabled")) {
    throw new Error("The selected payment method is unavailable.");
  }
  const cookieStore = await cookies();
  const cookieCode = cookieStore.get("northstar_affiliate")?.value?.trim().toUpperCase() || "";
  const requestedCode = input.affiliate_code?.trim().toUpperCase() || cookieCode;
  const affiliate = requestedCode
    ? db.prepare("SELECT id, code, commission_rate, discount_rate FROM affiliates WHERE code = ? AND status = 'active'").get(requestedCode) as { id: number; code: string; commission_rate: number; discount_rate: number } | undefined
    : undefined;
  const affiliateCode = affiliate?.code || null;
  const cart = z.array(z.object({ id: z.number().int(), quantity: z.number().int().positive().max(20) })).parse(JSON.parse(input.items));
  if (!cart.length) throw new Error("Cart is empty");
  const productStatement = db.prepare("SELECT id, name_en, price, inventory FROM products WHERE id = ? AND status = 'active'");
  let subtotal = 0;
  const verifiedItems = cart.map((item) => {
    const product = productStatement.get(item.id) as { id: number; name_en: string; price: number; inventory: number } | undefined;
    if (!product || product.inventory < item.quantity) throw new Error("A product is unavailable");
    subtotal += product.price * item.quantity;
    return { ...item, name: product.name_en, price: product.price };
  });
  const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  subtotal = roundMoney(subtotal);
  const discount = affiliate ? roundMoney(subtotal * (affiliate.discount_rate / 100)) : 0;
  const commissionBase = roundMoney(subtotal - discount);
  const shipping = subtotal >= 100 ? 0 : 12;
  const total = roundMoney(commissionBase + shipping);
  const attributedProductValue = affiliateCode === cookieCode ? Number(cookieStore.get("northstar_affiliate_product")?.value) : NaN;
  const attributedProduct = Number.isInteger(attributedProductValue)
    ? db.prepare("SELECT id FROM products WHERE id = ?").get(attributedProductValue) as { id: number } | undefined
    : undefined;
  const campaign = affiliateCode === cookieCode
    ? cookieStore.get("northstar_affiliate_campaign")?.value?.slice(0, 64) || null
    : null;
  const orderNo = `NS-${Date.now().toString(36).slice(-6).toUpperCase()}${randomUUID().slice(0, 2).toUpperCase()}`;
  const transaction = db.transaction(() => {
    const result = db.prepare(`INSERT INTO orders
      (order_no, customer_name, customer_email, total, subtotal, discount, shipping, status, payment_method, affiliate_code, attribution_product_id, affiliate_campaign, shipping_address, items)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'processing', ?, ?, ?, ?, ?, ?)`)
      .run(orderNo, input.customer_name, input.customer_email, total, subtotal, discount, shipping, input.payment_method, affiliateCode, attributedProduct?.id || null, campaign, input.shipping_address, JSON.stringify(verifiedItems));
    verifiedItems.forEach((item) => db.prepare("UPDATE products SET inventory = inventory - ? WHERE id = ?").run(item.quantity, item.id));
    if (affiliate) {
      const commission = roundMoney(commissionBase * (affiliate.commission_rate / 100));
      db.prepare("INSERT INTO commissions (affiliate_id, order_id, amount, base_amount) VALUES (?, ?, ?, ?)").run(affiliate.id, result.lastInsertRowid, commission, commissionBase);
      db.prepare(`UPDATE affiliates SET conversions = conversions + 1, revenue = revenue + ?, pending_commission = pending_commission + ? WHERE id = ?`).run(commissionBase, commission, affiliate.id);
    }
  });
  transaction();
  revalidatePath("/admin/orders");
  redirect(`/checkout/success?order=${orderNo}`);
}
