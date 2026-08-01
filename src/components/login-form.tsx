"use client";

import { useActionState, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { loginAction } from "@/app/actions";
import { backofficeCopy } from "@/lib/backoffice-i18n";
import type { Role } from "@/lib/auth";
import type { Locale } from "@/lib/types";

const accounts: Record<Role, { email: string }> = {
  admin: { email: "admin@northstar.demo" },
  affiliate: { email: "maya@northstar.demo" },
  support: { email: "support@northstar.demo" },
};

export function LoginForm({ initialRole, locale }: { initialRole: Role; locale: Locale }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  const account = accounts[role];
  const t = backofficeCopy[locale];
  const roleLabels: Record<Role, string> = { admin: t.operations, affiliate: t.creatorLogin, support: t.supportLogin };
  return (
    <form action={action} className="panel w-full max-w-md p-6 md:p-8">
      <div className="flex size-10 items-center justify-center rounded-[4px] bg-black text-white"><LockKeyhole size={19} /></div>
      <h1 className="mt-6 text-2xl font-bold">{t.workspaceSignIn}</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t.loginHelp}</p>
      <div className="mt-6 grid grid-cols-3 rounded-[5px] border bg-[#f2f2ef] p-1">{(Object.keys(accounts) as Role[]).map((key) => <button type="button" key={key} onClick={() => setRole(key)} className={`h-9 rounded-[3px] text-xs font-bold ${role === key ? "bg-white shadow-sm" : "text-[var(--muted)]"}`}>{roleLabels[key]}</button>)}</div>
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="locale" value={locale} />
      <div className="mt-6 grid gap-5"><label><span className="label">{t.email}</span><input key={`${role}-email`} className="field" name="email" type="email" defaultValue={account.email} required /></label><label><span className="label">{t.password}</span><input key={`${role}-password`} className="field" name="password" type="password" autoComplete="current-password" required /></label></div>
      {state.error && <p className="mt-4 rounded-[4px] bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="button-primary mt-6 w-full">{pending ? t.signingIn : t.continue}<ArrowRight size={17} /></button>
    </form>
  );
}
