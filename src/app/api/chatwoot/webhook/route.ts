import { db } from "@/lib/db";

export async function POST(request: Request) {
  const configuredToken = process.env.INBOUND_WEBHOOK_TOKEN;
  if (configuredToken && request.headers.get("x-webhook-token") !== configuredToken) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await request.json() as { event?: string; conversation?: { id?: number }; sender?: { name?: string; email?: string }; content?: string };
  if (payload.event !== "message_created" || !payload.content) return Response.json({ accepted: true });
  db.prepare(`INSERT INTO tickets (customer_name, customer_email, subject, channel, priority, last_message)
    VALUES (?, ?, ?, 'chatwoot', 'normal', ?)`)
    .run(payload.sender?.name || "Chatwoot contact", payload.sender?.email || "unknown@chatwoot.local", `Chatwoot conversation #${payload.conversation?.id || "new"}`, payload.content);
  return Response.json({ accepted: true }, { status: 201 });
}
