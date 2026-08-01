import { getDatabase } from "@/lib/db";

export async function POST(request: Request) {
  const configuredToken = process.env.INBOUND_WEBHOOK_TOKEN;
  if (configuredToken && request.headers.get("x-webhook-token") !== configuredToken) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await request.json() as { from?: string; name?: string; subject?: string; text?: string };
  if (!payload.from || !payload.text) return Response.json({ error: "Missing sender or message" }, { status: 400 });
  const database = await getDatabase();
  await database.prepare(`INSERT INTO tickets (customer_name, customer_email, subject, channel, priority, last_message)
    VALUES (?, ?, ?, 'email', 'normal', ?)`)
    .bind(payload.name || payload.from, payload.from, payload.subject || "Inbound email", payload.text).run();
  return Response.json({ accepted: true }, { status: 201 });
}
