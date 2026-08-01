import Link from "next/link";
import { Mail, MessageCircle, Send } from "lucide-react";
import { replyTicketAction } from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { backofficeCopy, localizeChannel } from "@/lib/backoffice-i18n";
import { getMessages, getTicket, getTickets } from "@/lib/db";
import { getBackofficeLocale } from "@/lib/store-context";
import { StatusPill } from "@/components/status-pill";

export const dynamic = "force-dynamic";

export default async function InboxPage({ searchParams }: PageProps<"/admin/inbox">) {
  await requireRole(["admin", "support"]);
  const tickets = await getTickets();
  const requested = Number((await searchParams).id);
  const selected = await getTicket(Number.isFinite(requested) && requested > 0 ? requested : tickets[0]?.id);
  const messages = selected ? await getMessages(selected.id) : [];
  const locale = await getBackofficeLocale();
  const t = backofficeCopy[locale];
  return <div className="mx-auto max-w-[1400px]"><div className="mb-6"><p className="text-xs font-semibold text-[var(--muted)]">{t.customerCare}</p><h1 className="mt-1 text-2xl font-bold">{t.unifiedInbox}</h1></div><div className="panel grid min-h-[680px] overflow-hidden lg:grid-cols-[340px_1fr]"><aside className="border-r"><div className="border-b p-4"><input className="field" placeholder={t.searchConversations} /></div><div className="divide-y">{tickets.map((ticket) => <Link key={ticket.id} href={`/admin/inbox?id=${ticket.id}`} className={`block p-4 hover:bg-[#fafaf8] ${selected?.id === ticket.id ? "bg-[#f4f4f0]" : ""}`}><div className="flex items-center justify-between gap-3"><div className="truncate text-sm font-bold">{ticket.customer_name}</div><span className="text-[10px] text-[var(--muted)]">{ticket.updated_at.slice(5, 16)}</span></div><div className="mt-1 truncate text-sm">{ticket.subject}</div><div className="mt-2 flex items-center justify-between"><span className="flex items-center gap-1 text-[11px] text-[var(--muted)]">{ticket.channel === "chatwoot" ? <MessageCircle size={12} /> : <Mail size={12} />}{localizeChannel(ticket.channel, locale)}</span><StatusPill value={ticket.status} locale={locale} /></div></Link>)}</div></aside>{selected ? <section className="flex min-w-0 flex-col"><header className="flex items-center justify-between border-b p-5"><div><h2 className="font-bold">{selected.subject}</h2><p className="mt-1 text-xs text-[var(--muted)]">{selected.customer_name} · {selected.customer_email}</p></div><div className="flex gap-2"><StatusPill value={selected.priority} locale={locale} /><StatusPill value={selected.status} locale={locale} /></div></header><div className="flex-1 space-y-5 overflow-auto bg-[#fafaf8] p-5"><div className="max-w-[680px] rounded-[5px] border bg-white p-4"><div className="text-xs font-bold">{selected.customer_name}</div><p className="mt-2 text-sm leading-6">{selected.last_message}</p><div className="mt-3 text-[10px] text-[var(--muted)]">{t.via} {localizeChannel(selected.channel, locale)}</div></div>{messages.map((message) => <div key={message.id} className="ml-auto max-w-[680px] rounded-[5px] bg-[#191b1a] p-4 text-white"><div className="text-xs font-bold">{message.sender}</div><p className="mt-2 text-sm leading-6 text-white/85">{message.body}</p><div className="mt-3 text-[10px] text-white/45">{message.created_at}</div></div>)}</div><form action={replyTicketAction} className="border-t bg-white p-4"><input type="hidden" name="ticket_id" value={selected.id} /><textarea name="body" className="field min-h-24" placeholder={t.writeReply} required /><div className="mt-3 flex justify-between"><span className="text-xs text-[var(--muted)]">{t.replyRoutesTo} {localizeChannel(selected.channel, locale)}</span><button className="button-primary"><Send size={15} />{t.sendReply}</button></div></form></section> : <div className="flex items-center justify-center text-sm text-[var(--muted)]">{t.noConversations}</div>}</div></div>;
}
