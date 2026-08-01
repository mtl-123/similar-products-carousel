import { createProductAction } from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { getBackofficeLocale } from "@/lib/store-context";
import { getProducts } from "@/lib/db";
import { ProductEditorForm } from "@/components/product-editor-form";

export default async function NewProductPage() {
  await requireRole(["admin"]);
  const locale = getBackofficeLocale();
  return <ProductEditorForm locale={locale} products={getProducts()} action={createProductAction} />;
}
