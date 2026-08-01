"use client";

import Image from "next/image";
import { Check, CreditCard, Landmark, ShieldCheck, Tag, WalletCards } from "lucide-react";
import { useState } from "react";
import { placeOrderAction } from "@/app/actions";
import { useCart } from "@/components/cart-provider";
import { useStoreLocale } from "@/components/store-locale-provider";
import { copy, formatCurrency } from "@/lib/i18n";

type PaymentMethod = "stripe" | "paypal" | "apple-pay" | "ach";
type AppliedCode = { code: string; discountRate: number };

export function CheckoutForm({ initialAffiliate, enabledMethods }: {
  initialAffiliate?: AppliedCode;
  enabledMethods: readonly PaymentMethod[];
}) {
  const { items, subtotal } = useCart();
  const locale = useStoreLocale();
  const t = copy[locale];
  const [codeInput, setCodeInput] = useState(initialAffiliate?.code || "");
  const [appliedCode, setAppliedCode] = useState<AppliedCode | undefined>(initialAffiliate);
  const [codeState, setCodeState] = useState<"idle" | "checking" | "valid" | "invalid">(initialAffiliate ? "valid" : "idle");
  const shipping = subtotal >= 100 ? 0 : 12;
  const discount = appliedCode ? Math.round(subtotal * (appliedCode.discountRate / 100) * 100) / 100 : 0;
  const total = Math.round((subtotal - discount + shipping) * 100) / 100;
  const allMethods: { value: PaymentMethod; icon: typeof CreditCard; title: string; body: string }[] = [
    { value: "stripe", icon: CreditCard, title: t.cardTitle, body: t.cardBody },
    { value: "paypal", icon: WalletCards, title: t.paypalTitle, body: t.paypalBody },
    { value: "apple-pay", icon: WalletCards, title: t.applePayTitle, body: t.applePayBody },
    { value: "ach", icon: Landmark, title: t.achTitle, body: t.achBody },
  ];
  const methods = allMethods.filter((method) => enabledMethods.includes(method.value));

  async function applyCode() {
    const normalized = codeInput.trim().toUpperCase();
    setCodeState("checking");
    try {
      const response = await fetch(`/api/affiliate-code?code=${encodeURIComponent(normalized)}`, { cache: "no-store" });
      const result = await response.json() as { valid: boolean; code?: string; discountRate?: number };
      if (result.valid && result.code && typeof result.discountRate === "number") {
        setAppliedCode({ code: result.code, discountRate: result.discountRate });
        setCodeInput(result.code);
        setCodeState("valid");
      } else {
        setAppliedCode(undefined);
        setCodeState("invalid");
      }
    } catch {
      setAppliedCode(undefined);
      setCodeState("invalid");
    }
  }

  return (
    <form action={placeOrderAction} className="grid gap-9 lg:grid-cols-[1fr_420px] lg:gap-14">
      <input type="hidden" name="items" value={JSON.stringify(items.map(({ id, quantity }) => ({ id, quantity })))} />
      <input type="hidden" name="affiliate_code" value={appliedCode?.code || ""} />
      <div className="space-y-8">
        <section>
          <div className="mb-5 flex items-baseline justify-between"><h2 className="text-xl font-bold">{t.contact}</h2><span className="text-xs text-[var(--muted)]">{t.secureCheckout}</span></div>
          <div className="grid gap-4 sm:grid-cols-2"><label><span className="label">{t.fullName}</span><input className="field" name="customer_name" required /></label><label><span className="label">{t.email}</span><input className="field" type="email" name="customer_email" required /></label></div>
        </section>

        <section>
          <h2 className="mb-5 text-xl font-bold">{t.shippingAddress}</h2>
          <label><span className="label">{t.addressLabel}</span><textarea className="field" name="shipping_address" required placeholder="1200 Market St, Apt 4B, San Francisco, CA 94102" /></label>
        </section>

        <section>
          <div className="flex items-center gap-3"><Tag size={19} /><h2 className="text-xl font-bold">{t.promoCode}</h2></div>
          <p className="mt-2 text-sm text-[var(--muted)]">{t.promoCodeBody}</p>
          <div className="mt-4 flex max-w-md gap-2">
            <input
              className="field font-mono uppercase"
              data-testid="promo-code-input"
              value={codeInput}
              aria-label={t.promoCode}
              onChange={(event) => {
                setCodeInput(event.target.value);
                if (event.target.value.trim().toUpperCase() !== appliedCode?.code) {
                  setAppliedCode(undefined);
                  setCodeState("idle");
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void applyCode();
                }
              }}
            />
            <button type="button" disabled={codeState === "checking"} onClick={() => void applyCode()} className="button-secondary shrink-0" data-testid="apply-promo-code">{t.applyCode}</button>
          </div>
          {codeState === "valid" && appliedCode && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--green)]" data-testid="code-applied"><Check size={16} />{t.codeApplied} · {appliedCode.discountRate}%</p>}
          {codeState === "invalid" && <p className="mt-3 text-sm font-semibold text-[var(--accent)]" data-testid="code-invalid">{t.invalidCode}</p>}
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">{t.payment}</h2>
          <p className="mb-5 text-sm text-[var(--muted)]">{t.paymentSandbox}</p>
          {methods.length ? <div className="grid gap-3 sm:grid-cols-2">{methods.map(({ value, icon: Icon, title, body }, index) => <label key={value} className="flex cursor-pointer items-start gap-3 rounded-[5px] border bg-white p-4 has-[:checked]:border-black has-[:checked]:ring-1 has-[:checked]:ring-black"><input type="radio" name="payment_method" value={value} defaultChecked={index === 0} className="mt-1" /><Icon size={19} /><span><span className="block text-sm font-bold">{title}</span><span className="text-xs text-[var(--muted)]">{body}</span></span></label>)}</div> : <div className="rounded-[5px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">{t.checkoutUnavailable}</div>}
        </section>
      </div>

      <aside className="panel h-fit p-5 lg:sticky lg:top-28">
        <h2 className="text-lg font-bold">{t.orderSummary}</h2>
        <div className="mt-5 max-h-[320px] space-y-4 overflow-auto pr-1">{items.map((item) => <div key={item.id} className="flex gap-3"><div className="relative size-16 shrink-0 overflow-hidden rounded-[4px] bg-gray-100"><Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" /><span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black text-[10px] text-white">{item.quantity}</span></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.name}</div><div className="text-xs text-[var(--muted)]">{formatCurrency(item.price)}</div></div><div className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</div></div>)}</div>
        <div className="mt-6 space-y-3 border-t pt-5 text-sm">
          <div className="flex justify-between"><span className="text-[var(--muted)]">{t.subtotal}</span><span>{formatCurrency(subtotal)}</span></div>
          {appliedCode && <div className="flex justify-between text-[var(--green)]" data-testid="checkout-discount"><span>{t.discount} ({appliedCode.discountRate}%)</span><span>-{formatCurrency(discount)}</span></div>}
          <div className="flex justify-between"><span className="text-[var(--muted)]">{t.shipping}</span><span>{shipping === 0 ? t.free : formatCurrency(shipping)}</span></div>
          {appliedCode && <div className="flex justify-between text-[var(--green)]"><span>{t.creatorAttributed}</span><span>{appliedCode.code}</span></div>}
          <div className="flex justify-between border-t pt-4 text-lg font-bold"><span>{t.total}</span><span data-testid="checkout-total">{formatCurrency(total)}</span></div>
        </div>
        <button type="submit" disabled={!items.length || !methods.length} className="button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40">{t.placeOrder}</button>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--muted)]"><ShieldCheck size={14} />{t.encryptedHandoff}</div>
      </aside>
    </form>
  );
}
