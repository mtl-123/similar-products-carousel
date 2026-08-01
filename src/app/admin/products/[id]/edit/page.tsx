import { notFound } from "next/navigation";
import { updateProductAction } from "@/app/actions";
import { ProductEditorForm } from "@/components/product-editor-form";
import { requireRole } from "@/lib/auth";
import { getProductById, getProducts } from "@/lib/db";
import { getBackofficeLocale } from "@/lib/store-context";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  await requireRole(["admin"]);
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const product = await getProductById(id);
  if (!product) notFound();

  const [locale, products] = await Promise.all([getBackofficeLocale(), getProducts()]);
  return <ProductEditorForm locale={locale} product={product} products={products} action={updateProductAction} />;
}
