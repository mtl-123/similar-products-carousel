import path from "node:path";
import Database from "better-sqlite3";
import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, role: "admin" | "affiliate", email: string, password: string) {
  await page.goto(`/login?role=${role}`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator("form button").last().click();
  await expect(page).toHaveURL(role === "admin" ? /\/admin$/ : /\/affiliate$/);
}

async function submitCheckout(page: Page, email: string) {
  await page.locator('input[name="customer_name"]').fill("Affiliate Test Customer");
  await page.locator('input[name="customer_email"]').fill(email);
  await page.locator('textarea[name="shipping_address"]').fill("1200 Market Street, San Francisco, CA 94102");
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/checkout\/success\?order=/);
}

test("deep links, discount codes, net commission, approval, and refunds stay consistent", async ({ browser }) => {
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, "admin", "admin@northstar.demo", "northstar-admin");

  await adminPage.goto("/admin/affiliates");
  const termsRow = adminPage.locator('[data-affiliate-code="MAYA20"]');
  const termsForm = termsRow.locator("form").first();
  await termsForm.locator('input[name="commission_rate"]').fill("15");
  await termsForm.locator('input[name="discount_rate"]').fill("5");
  await termsForm.locator("button").click();
  await expect(termsForm.locator('input[name="commission_rate"]')).toHaveValue("15");
  await expect(termsForm.locator('input[name="discount_rate"]')).toHaveValue("5");

  const database = new Database(path.join(process.cwd(), ".data-e2e", "northstar.db"), { readonly: true, fileMustExist: true });
  const baseline = database.prepare("SELECT conversions, revenue, pending_commission, available_commission FROM affiliates WHERE code = 'MAYA20'").get() as {
    conversions: number;
    revenue: number;
    pending_commission: number;
    available_commission: number;
  };

  const creatorContext = await browser.newContext();
  const creatorPage = await creatorContext.newPage();
  await login(creatorPage, "affiliate", "maya@northstar.demo", "creator-demo");
  await creatorPage.locator('[data-testid="affiliate-destination"]').selectOption("/");
  expect(new URL(await creatorPage.locator('[data-testid="affiliate-link"]').inputValue()).searchParams.get("to")).toBe("/");
  await creatorPage.locator('[data-testid="affiliate-destination"]').selectOption("/shop");
  expect(new URL(await creatorPage.locator('[data-testid="affiliate-link"]').inputValue()).searchParams.get("to")).toBe("/shop");
  await creatorPage.locator('[data-testid="affiliate-destination"]').selectOption("/product/voyager-carry-on");
  await creatorPage.locator('[data-testid="affiliate-campaign"]').fill("youtube-review");
  const deepLink = await creatorPage.locator('[data-testid="affiliate-link"]').inputValue();
  expect(deepLink).toContain("/r/MAYA20?");
  expect(deepLink).toContain("to=%2Fproduct%2Fvoyager-carry-on");
  expect(deepLink).toContain("campaign=youtube-review");
  await expect(creatorPage.locator('[data-testid="affiliate-discount-code"]')).toHaveValue("MAYA20");

  const customerContext = await browser.newContext();
  const customerPage = await customerContext.newPage();
  const unsafeRedirect = await customerContext.request.get("/r/MAYA20?to=https%3A%2F%2Funtrusted.example%2Fcheckout", { maxRedirects: 0 });
  expect(unsafeRedirect.status()).toBe(307);
  expect(unsafeRedirect.headers().location).toBe("http://127.0.0.1:9401/");
  await customerPage.goto(deepLink);
  await expect(customerPage).toHaveURL(/\/product\/voyager-carry-on$/);
  expect(new URL(customerPage.url()).origin).toBe("http://127.0.0.1:9401");
  const referralCookies = await customerContext.cookies();
  expect(referralCookies.find((cookie) => cookie.name === "northstar_affiliate")?.value).toBe("MAYA20");
  expect(referralCookies.find((cookie) => cookie.name === "northstar_affiliate_campaign")?.value).toBe("youtube-review");

  const product = database.prepare("SELECT id FROM products WHERE slug = 'voyager-carry-on'").get() as { id: number };
  const click = database.prepare("SELECT destination, product_id, campaign FROM affiliate_clicks ORDER BY id DESC LIMIT 1").get() as { destination: string; product_id: number; campaign: string };
  expect(click).toEqual({ destination: "/product/voyager-carry-on", product_id: product.id, campaign: "youtube-review" });

  await customerPage.locator('[data-testid="add-to-cart"]').click();
  await customerPage.goto("/checkout");
  await expect(customerPage.locator('[data-testid="code-applied"]')).toContainText("5%");
  await expect(customerPage.locator('[data-testid="checkout-discount"]')).toContainText("$11.90");
  await expect(customerPage.locator('[data-testid="checkout-total"]')).toHaveText("$226.10");
  await submitCheckout(customerPage, "deep-link@example.com");

  const deepOrder = database.prepare("SELECT * FROM orders WHERE customer_email = ?").get("deep-link@example.com") as {
    id: number;
    order_no: string;
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
    affiliate_code: string;
    attribution_product_id: number;
    affiliate_campaign: string;
  };
  expect(deepOrder.subtotal).toBeCloseTo(238);
  expect(deepOrder.discount).toBeCloseTo(11.9);
  expect(deepOrder.shipping).toBe(0);
  expect(deepOrder.total).toBeCloseTo(226.1);
  expect(deepOrder.affiliate_code).toBe("MAYA20");
  expect(deepOrder.attribution_product_id).toBe(product.id);
  expect(deepOrder.affiliate_campaign).toBe("youtube-review");

  let commission = database.prepare("SELECT amount, base_amount, status, reversed_from_status FROM commissions WHERE order_id = ?").get(deepOrder.id) as { amount: number; base_amount: number; status: string; reversed_from_status: string | null };
  expect(commission.base_amount).toBeCloseTo(226.1);
  expect(commission.amount).toBeCloseTo(33.92);
  expect(commission.status).toBe("pending");
  let affiliate = database.prepare("SELECT conversions, revenue, pending_commission, available_commission FROM affiliates WHERE code = 'MAYA20'").get() as typeof baseline;
  expect(affiliate.conversions).toBe(baseline.conversions + 1);
  expect(affiliate.revenue).toBeCloseTo(baseline.revenue + 226.1);
  expect(affiliate.pending_commission).toBeCloseTo(baseline.pending_commission + 33.92);

  await adminPage.goto("/admin/orders");
  let orderRow = adminPage.locator(`[data-order-no="${deepOrder.order_no}"]`);
  await orderRow.locator('select[name="status"]').selectOption("completed");
  await orderRow.locator("button").click();
  await expect.poll(() => (database.prepare("SELECT status FROM commissions WHERE order_id = ?").get(deepOrder.id) as { status: string }).status).toBe("approved");
  affiliate = database.prepare("SELECT conversions, revenue, pending_commission, available_commission FROM affiliates WHERE code = 'MAYA20'").get() as typeof baseline;
  expect(affiliate.pending_commission).toBeCloseTo(baseline.pending_commission);
  expect(affiliate.available_commission).toBeCloseTo(baseline.available_commission + 33.92);

  orderRow = adminPage.locator(`[data-order-no="${deepOrder.order_no}"]`);
  await orderRow.locator('select[name="status"]').selectOption("refunded");
  await orderRow.locator("button").click();
  await expect.poll(() => (database.prepare("SELECT status FROM commissions WHERE order_id = ?").get(deepOrder.id) as { status: string }).status).toBe("reversed");
  commission = database.prepare("SELECT amount, base_amount, status, reversed_from_status FROM commissions WHERE order_id = ?").get(deepOrder.id) as typeof commission;
  expect(commission.status).toBe("reversed");
  expect(commission.reversed_from_status).toBe("approved");
  affiliate = database.prepare("SELECT conversions, revenue, pending_commission, available_commission FROM affiliates WHERE code = 'MAYA20'").get() as typeof baseline;
  expect(affiliate.conversions).toBe(baseline.conversions);
  expect(affiliate.revenue).toBeCloseTo(baseline.revenue);
  expect(affiliate.pending_commission).toBeCloseTo(baseline.pending_commission);
  expect(affiliate.available_commission).toBeCloseTo(baseline.available_commission);

  const codeCustomerContext = await browser.newContext();
  const codeCustomerPage = await codeCustomerContext.newPage();
  await codeCustomerPage.goto("/product/voyager-carry-on");
  await codeCustomerPage.locator('[data-testid="add-to-cart"]').click();
  await codeCustomerPage.goto("/checkout");
  await codeCustomerPage.locator('[data-testid="promo-code-input"]').fill("NOT-A-CODE");
  await codeCustomerPage.locator('[data-testid="apply-promo-code"]').click();
  await expect(codeCustomerPage.locator('[data-testid="code-invalid"]')).toBeVisible();
  await codeCustomerPage.locator('[data-testid="promo-code-input"]').fill("MAYA20");
  await codeCustomerPage.locator('[data-testid="apply-promo-code"]').click();
  await expect(codeCustomerPage.locator('[data-testid="code-applied"]')).toContainText("5%");
  await submitCheckout(codeCustomerPage, "manual-code@example.com");

  const codeOrder = database.prepare("SELECT id, order_no, affiliate_code, attribution_product_id, affiliate_campaign, discount FROM orders WHERE customer_email = ?").get("manual-code@example.com") as {
    id: number;
    order_no: string;
    affiliate_code: string;
    attribution_product_id: number | null;
    affiliate_campaign: string | null;
    discount: number;
  };
  expect(codeOrder.affiliate_code).toBe("MAYA20");
  expect(codeOrder.attribution_product_id).toBeNull();
  expect(codeOrder.affiliate_campaign).toBeNull();
  expect(codeOrder.discount).toBeCloseTo(11.9);

  await adminPage.goto("/admin/orders");
  orderRow = adminPage.locator(`[data-order-no="${codeOrder.order_no}"]`);
  await orderRow.locator('select[name="status"]').selectOption("refunded");
  await orderRow.locator("button").click();
  await expect.poll(() => (database.prepare("SELECT status FROM commissions WHERE order_id = ?").get(codeOrder.id) as { status: string }).status).toBe("reversed");
  affiliate = database.prepare("SELECT conversions, revenue, pending_commission, available_commission FROM affiliates WHERE code = 'MAYA20'").get() as typeof baseline;
  expect(affiliate.conversions).toBe(baseline.conversions);
  expect(affiliate.revenue).toBeCloseTo(baseline.revenue);
  expect(affiliate.pending_commission).toBeCloseTo(baseline.pending_commission);
  expect(affiliate.available_commission).toBeCloseTo(baseline.available_commission);

  database.close();
  await Promise.all([adminContext.close(), creatorContext.close(), customerContext.close(), codeCustomerContext.close()]);
});
