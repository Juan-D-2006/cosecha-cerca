"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { cardCls, inputCls, labelCls, primaryBtn } from "@/components/ui";
import type { BuyerType, UserRole } from "@/types/domain";

const BUYER_TYPES: BuyerType[] = ["market", "restaurant", "community_kitchen", "other"];

export function RegisterForm() {
  const { dict } = useI18n();
  const a = dict.auth;
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("buyer");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const f = new FormData(e.currentTarget);
    const { data, error } = await createClient().auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: {
        // El trigger handle_new_user crea el perfil con estos datos
        data: {
          role,
          buyer_type: role === "buyer" ? f.get("buyer_type") : null,
          full_name: f.get("full_name"),
          organization_name: f.get("organization_name") || null,
          phone: f.get("phone") || null,
        },
      },
    });
    setPending(false);
    if (error) {
      setMessage({ ok: false, text: error.message || dict.errors.generic });
      return;
    }
    if (data.session) {
      router.push(role === "farmer" ? "/panel" : "/catalogo");
      router.refresh();
    } else {
      setMessage({ ok: true, text: a.checkEmail });
    }
  }

  const roleOption = (value: UserRole, title: string, hint: string) => (
    <label
      className={`flex-1 cursor-pointer rounded-md border p-3 text-sm ${
        role === value ? "border-green-700 bg-green-50" : "border-stone-300"
      }`}
    >
      <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
      <span className="block font-medium">{title}</span>
      <span className="text-stone-600">{hint}</span>
    </label>
  );

  return (
    <form onSubmit={onSubmit} className={`${cardCls} mx-auto max-w-md space-y-4`}>
      <h1 className="text-xl font-semibold">{a.registerTitle}</h1>

      <fieldset>
        <legend className="mb-2 text-sm">{a.iAm}</legend>
        <div className="flex gap-3">
          {roleOption("farmer", a.farmer, a.farmerHint)}
          {roleOption("buyer", a.buyer, a.buyerHint)}
        </div>
      </fieldset>

      {role === "buyer" && (
        <label className={labelCls}>
          {a.buyerType}
          <select name="buyer_type" className={inputCls} defaultValue="restaurant">
            {BUYER_TYPES.map((bt) => (
              <option key={bt} value={bt}>{a.buyerTypes[bt]}</option>
            ))}
          </select>
        </label>
      )}

      <label className={labelCls}>
        {a.fullName}
        <input name="full_name" required minLength={2} autoComplete="name" className={inputCls} />
      </label>
      <label className={labelCls}>
        {a.orgName}
        <input name="organization_name" className={inputCls} />
      </label>
      <label className={labelCls}>
        {a.phone}
        <input name="phone" type="tel" autoComplete="tel" className={inputCls} />
      </label>
      <label className={labelCls}>
        {a.email}
        <input name="email" type="email" required autoComplete="email" className={inputCls} />
      </label>
      <label className={labelCls}>
        {a.password}
        <input name="password" type="password" required minLength={6} autoComplete="new-password" className={inputCls} />
        <span className="text-xs text-stone-500">{a.passwordHint}</span>
      </label>

      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>
      )}
      <button disabled={pending} className={`${primaryBtn} w-full`}>{a.submitRegister}</button>
      <p className="text-center text-sm text-stone-600">
        {a.haveAccount} <Link href="/login" className="text-green-800 underline">{dict.common.login}</Link>
      </p>
    </form>
  );
}
