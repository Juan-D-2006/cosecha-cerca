"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, Store } from "lucide-react";
import { useI18n } from "@/i18n/client";
import type { UserRole } from "@/types/domain";

export function NavLinks({ role }: { role: UserRole }) {
  const { dict } = useI18n();
  const pathname = usePathname();
  const links = [
    { href: "/catalogo", label: dict.common.catalog, Icon: Store },
    ...(role === "farmer" ? [{ href: "/panel", label: dict.common.myPanel, Icon: LayoutDashboard }] : []),
    ...(role === "buyer" ? [{ href: "/pedidos", label: dict.common.myOrders, Icon: ClipboardList }] : []),
  ];

  return (
    <>
      {links.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors duration-150 ${
              active ? "bg-green-700 text-stone-50" : "text-stone-700 hover:bg-stone-200/60"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </>
  );
}
