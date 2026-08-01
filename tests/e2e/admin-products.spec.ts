import { expect, test } from "@playwright/test";

test("administrator can edit, unpublish, and republish a product", async ({ page, request }) => {
  await page.goto("/login?role=admin");
  await expect(page.getByRole("heading", { name: "Workspace sign in" })).toBeVisible();
  await page.locator('input[name="password"]').fill("northstar-admin");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/settings");
  await page.locator('select[name="default_locale"]').selectOption("zh");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("button", { name: "保存设置" })).toBeVisible();

  await page.goto("/admin/products");
  let productRow = page.getByRole("row").filter({ hasText: "远行登机箱" });
  await productRow.getByRole("link", { name: "修改" }).click();
  await expect(page.getByRole("heading", { name: "修改商品" })).toBeVisible();
  await expect(page.locator('input[name="sku"]')).toHaveValue("NS-TR-001");

  await page.locator('input[name="name_en"]').fill("Automated Voyager Carry-On");
  await page.locator('input[name="name_zh"]').fill("自动化测试登机箱");
  await page.locator('input[name="inventory"]').fill("27");
  await page.locator('textarea[name="highlights_en"]').fill("Fast setup\nReliable everyday performance");
  await page.locator('textarea[name="highlights_zh"]').fill("安装简单\n日常运行稳定");
  await page.locator('textarea[name="specifications_en"]').fill("Storage: 128 GB\nVideo output: 4K");
  await page.locator('textarea[name="specifications_zh"]').fill("存储空间: 128 GB\n视频输出: 4K");
  await page.locator('textarea[name="box_contents_en"]').fill("Device\nRemote control\nPower adapter");
  await page.locator('input[name="image_file"]').setInputFiles({
    name: "automated-product.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+XxL0AAAAAElFTkSuQmCC", "base64"),
  });
  await page.locator('textarea[name="box_contents_zh"]').fill("主机\n遥控器\n电源适配器");
  const relatedEditor = page.getByTestId("related-products-editor");
  await relatedEditor.getByRole("checkbox", { name: /山脊数码收纳包/ }).check();
  await relatedEditor.getByRole("checkbox", { name: /城市通勤斜挎包/ }).check();
  await relatedEditor.screenshot({ path: "test-results/related-products-admin.png" });
  await page.getByRole("button", { name: "保存修改" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);

  productRow = page.getByRole("row").filter({ hasText: "自动化测试登机箱" });
  await expect(productRow).toContainText("27");
  const uploadedImage = productRow.locator("img");
  await expect(uploadedImage).toBeVisible();
  await expect.poll(() => uploadedImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await productRow.getByRole("link", { name: "修改" }).click();
  await expect(page.getByTestId("related-products-editor").getByRole("checkbox", { name: /山脊数码收纳包/ })).toBeChecked();
  await expect(page.getByTestId("related-products-editor").getByRole("checkbox", { name: /城市通勤斜挎包/ })).toBeChecked();

  await page.goto("/product/voyager-carry-on");
  const recommendations = page.getByTestId("similar-products");
  await expect(recommendations.getByRole("heading", { name: "相似商品" })).toBeVisible();
  const recommendationCards = recommendations.locator("[data-related-product-id]");
  await expect(recommendationCards).toHaveCount(5);
  await expect(recommendationCards.nth(0)).toContainText("山脊数码收纳包");
  await expect(recommendationCards.nth(1)).toContainText("城市通勤斜挎包");
  const recommendationTrack = recommendations.getByTestId("similar-products-track");
  await recommendations.getByRole("button", { name: "下一组相似商品" }).click();
  await expect.poll(() => recommendationTrack.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

  await page.goto("/admin/products");
  let relatedProductRow = page.getByRole("row").filter({ hasText: "城市通勤斜挎包" });
  await relatedProductRow.getByRole("button", { name: "下架" }).click();
  await expect(relatedProductRow).toContainText("草稿");
  await page.goto("/product/voyager-carry-on");
  await expect(page.getByTestId("similar-products").locator('a[href="/product/transit-sling"]')).toHaveCount(0);
  await page.goto("/admin/products");
  relatedProductRow = page.getByRole("row").filter({ hasText: "城市通勤斜挎包" });
  await relatedProductRow.getByRole("button", { name: "上架" }).click();
  await expect(relatedProductRow).toContainText("已启用");

  productRow = page.getByRole("row").filter({ hasText: "自动化测试登机箱" });
  await productRow.getByRole("button", { name: "下架" }).click();
  await expect(productRow).toContainText("草稿");
  await expect(productRow.getByRole("button", { name: "上架" })).toBeVisible();

  const hiddenProduct = await request.get("/product/voyager-carry-on");
  expect(hiddenProduct.status()).toBe(404);
  const hiddenShop = await request.get("/shop");
  expect(await hiddenShop.text()).not.toContain("自动化测试登机箱");

  await productRow.getByRole("button", { name: "上架" }).click();
  await expect(productRow).toContainText("已启用");
  await expect(productRow.getByRole("button", { name: "下架" })).toBeVisible();

  const publishedProduct = await request.get("/product/voyager-carry-on");
  expect(publishedProduct.status()).toBe(200);
  const productHtml = await publishedProduct.text();
  expect(productHtml).toContain("自动化测试登机箱");
  expect(productHtml).toContain("遥控器");
  expect(productHtml).toContain("128 GB");
});
