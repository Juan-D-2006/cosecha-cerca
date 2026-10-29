import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { getSession } from "@/lib/auth";
import type { Dictionary } from "@/i18n/dictionaries";
import { BrandMark } from "@/components/brand/BrandMark";
import { TextileBand } from "@/components/brand/TextileBand";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLinks } from "./NavLinks";

export async function SiteHeader({ dict }: { dict: Dictionary }) {
  const { profile } = await getSession();

  return (
    <header className="glass sticky top-0 z-30 bg-stone-50/80 backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm sm:gap-3">
        <Link href="/" className="mr-auto flex items-center gap-2.5" aria-label={dict.common.appName}>
          <BrandMark className="h-9 w-9" />
          <span className="font-display hidden text-xl font-semibold text-green-900 min-[440px]:inline">{dict.common.appName}</span>
        </Link>
        {profile ? (
          <>
            <NavLinks role={profile.role} />
            <form action="/auth/signout" method="post">
              <button
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900"
                title={dict.common.logout}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden md:inline">{dict.common.logout}</span>
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-stone-700 hover:bg-stone-200/60">
            <LogIn className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{dict.common.login}</span>
          </Link>
        )}
        <LanguageSwitcher />
      </nav>
      <TextileBand animate className="h-2" />
    </header>
  );
}
