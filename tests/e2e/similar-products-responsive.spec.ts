import { expect, test, type Locator, type Page } from "@playwright/test";

async function verifyCarouselLayout(page: Page, section: Locator) {
  const track = section.getByTestId("similar-products-track");
  const cards = section.locator("[data-related-product-id]");
  await expect(cards.first()).toBeVisible();
  expect(await track.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  expect((first?.x || 0) + (first?.width || 0)).toBeLessThanOrEqual(second?.x || 0);
}

test("similar products carousel remains usable on desktop and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/product/voyager-carry-on");
  let section = page.getByTestId("similar-products");
  await section.scrollIntoViewIfNeeded();
  await verifyCarouselLayout(page, section);
  await section.screenshot({ path: "test-results/similar-products-desktop.png" });

  const track = section.getByTestId("similar-products-track");
  await section.getByRole("button", { name: /Next similar items|下一组相似商品/ }).click();
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  section = page.getByTestId("similar-products");
  await section.scrollIntoViewIfNeeded();
  await verifyCarouselLayout(page, section);
  await section.screenshot({ path: "test-results/similar-products-mobile.png" });
});
