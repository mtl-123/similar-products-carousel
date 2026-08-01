import { CheckCircle2, Clock3, Mail, MessageCircle } from "lucide-react";
import { createTicketAction } from "@/app/actions";
import { copy } from "@/lib/i18n";
import { getStoreLocale } from "@/lib/store-context";

export default async function SupportPage({ searchParams }: PageProps<"/support">) {
  const sent = (await searchParams).sent === "1";
  const locale = await getStoreLocale();
  const t = copy[locale];

  return <div className="shell py-12 md:py-20"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
    <div>
      <p className="eyebrow text-[var(--accent)]">{t.customerCare}</p>
      <h1 className="mt-3 text-4xl font-bold md:text-6xl">{t.supportTitle}</h1>
      <p className="mt-5 max-w-md leading-7 text-[var(--muted)]">{t.supportBody}</p>
      <div className="mt-8 grid gap-4">
        <div className="flex gap-3"><Mail size={19} /><div><div className="text-sm font-bold">{t.emailSupport}</div><div className="text-sm text-[var(--muted)]">support@northstar.demo</div></div></div>
        <div className="flex gap-3"><MessageCircle size={19} /><div><div className="text-sm font-bold">{t.liveChat}</div><div className="text-sm text-[var(--muted)]">{t.chatReady}</div></div></div>
        <div className="flex gap-3"><Clock3 size={19} /><div><div className="text-sm font-bold">{t.responseTarget}</div><div className="text-sm text-[var(--muted)]">{t.responseTime}</div></div></div>
      </div>
    </div>
    <div className="panel p-6 md:p-8">{sent
      ? <div className="flex min-h-[390px] flex-col items-center justify-center text-center"><CheckCircle2 size={44} className="text-[var(--green)]" /><h2 className="mt-5 text-2xl font-bold">{t.messageReceived}</h2><p className="mt-2 max-w-sm text-[var(--muted)]">{t.messageReceivedBody}</p></div>
      : <form action={createTicketAction}><h2 className="text-xl font-bold">{t.startConversation}</h2><div className="mt-6 grid gap-5 sm:grid-cols-2"><label><span className="label">{t.name}</span><input className="field" name="customer_name" required /></label><label><span className="label">{t.email}</span><input className="field" name="customer_email" type="email" required /></label><label className="sm:col-span-2"><span className="label">{t.subject}</span><input className="field" name="subject" required /></label><label className="sm:col-span-2"><span className="label">{t.howCanWeHelp}</span><textarea className="field" name="message" required /></label></div><button className="button-primary mt-6">{t.sendMessage}</button></form>}
    </div>
  </div></div>;
}
