"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { cardCls, inputCls, labelCls, primaryBtn } from "@/components/ui";

export function LoginForm() {
  const { dict } = useI18n();
  const a = dict.auth;
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const { error } = await createClient().auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setPending(false);
    if (error) {
      setError(error.message.includes("Invalid login") ? a.invalidCredentials : dict.errors.generic);
      return;
    }
    // Solo rutas internas para evitar redirecciones abiertas
    router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className={`${cardCls} mx-auto max-w-sm space-y-4`}>
      <h1 className="text-xl font-semibold">{a.loginTitle}</h1>
      <label className={labelCls}>
        {a.email}
        <input name="email" type="email" required autoComplete="email" className={inputCls} />
      </label>
      <label className={labelCls}>
        {a.password}
        <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={pending} className={`${primaryBtn} w-full`}>{a.submitLogin}</button>
      <p className="text-center text-sm text-stone-600">
        {a.noAccount} <Link href="/registro" className="text-green-800 underline">{dict.common.register}</Link>
      </p>
    </form>
  );
}
