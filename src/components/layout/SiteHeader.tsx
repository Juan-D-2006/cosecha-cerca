import Link from "next/link";
import { getSession } from "@/lib/auth";
import type { Dictionary } from "@/i18n/dictionaries";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function SiteHeader({ dict }: { dict: Dictionary }) {
  const { profile } = await getSession();

  return (
    <header className="border-b border-stone-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
        <Link href="/" className="mr-auto text-base font-semibold text-green-800">
          {dict.common.appName}
        </Link>
        {profile && <Link href="/catalogo" className="hover:underline">{dict.common.catalog}</Link>}
        {profile?.role === "farmer" && <Link href="/panel" className="hover:underline">{dict.common.myPanel}</Link>}
        {profile?.role === "buyer" && <Link href="/pedidos" className="hover:underline">{dict.common.myOrders}</Link>}
        {profile ? (
          <form action="/auth/signout" method="post">
            <button className="text-stone-600 hover:underline">{dict.common.logout}</button>
          </form>
        ) : (
          <>
            <Link href="/login" className="hover:underline">{dict.common.login}</Link>
            <Link href="/registro" className="rounded-md bg-green-700 px-3 py-1.5 font-medium text-white hover:bg-green-800">
              {dict.common.register}
            </Link>
          </>
        )}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
