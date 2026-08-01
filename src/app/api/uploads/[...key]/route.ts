import { getUploadsStore } from "@/lib/db";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  const objectKey = Array.isArray(key) ? key.join("/") : key;
  if (!objectKey || objectKey.includes("..")) return new Response("Not found", { status: 404 });

  const uploads = await getUploadsStore();
  const object = await uploads.getWithMetadata<{ contentType?: string; cacheControl?: string }>(objectKey, "stream");
  if (!object.value) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("content-type", object.metadata?.contentType || "application/octet-stream");
  headers.set("cache-control", object.metadata?.cacheControl || "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.value, { headers });
}
