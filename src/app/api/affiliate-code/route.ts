import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase() || "";
  if (!/^[A-Z0-9_-]{2,40}$/.test(code)) {
    return NextResponse.json({ valid: false }, { headers: { "Cache-Control": "no-store" } });
  }

  const database = await getDatabase();
  const affiliate = await database.prepare("SELECT code, discount_rate FROM affiliates WHERE code = ? AND status = 'active'").bind(code).first<{ code: string; discount_rate: number }>();
  return NextResponse.json(
    affiliate ? { valid: true, code: affiliate.code, discountRate: affiliate.discount_rate } : { valid: false },
    { headers: { "Cache-Control": "no-store" } },
  );
}
