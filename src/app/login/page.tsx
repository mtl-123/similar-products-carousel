import Link from "next/link";
import type { Role } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { getBackofficeLocale } from "@/lib/store-context";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const requested = (await searchParams).role;
  const role: Role = requested === "affiliate" || requested === "support" ? requested : "admin";
  const locale = getBackofficeLocale();
  return <main className="flex min-h-screen flex-col bg-[#ededE8]"><div className="flex h-16 items-center border-b bg-white px-6"><Link href="/" className="text-lg font-black uppercase">Northstar<span className="text-[var(--accent)]">.</span></Link></div><div className="flex flex-1 items-center justify-center p-5"><LoginForm initialRole={role} locale={locale} /></div></main>;
}
