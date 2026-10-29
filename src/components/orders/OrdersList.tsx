"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { apiFetch, errorText } from "@/lib/api";
import { formatDateTime, formatNumber, formatPrice, t } from "@/lib/format";
import { cardCls, primaryBtn, secondaryBtn } from "@/components/ui";
import type { OrderRow, OrderStatus } from "@/types/domain";

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-blue-100 text-blue-900",
  ready: "bg-green-100 text-green-900",
  completed: "bg-stone-200 text-stone-800",
  cancelled: "bg-red-100 text-red-900",
  expired: "bg-stone-200 text-stone-600",
};

/** Siguiente paso que puede dar el agricultor */
const NEXT_STEP: Partial<Record<OrderStatus, "confirmed" | "ready" | "completed">> = {
  pending: "confirmed",
  confirmed: "ready",
  ready: "completed",
};

export function OrdersList({ orders, viewAs }: { orders: OrderRow[]; viewAs: "farmer" | "buyer" }) {
  const { dict } = useI18n();
  if (orders.length === 0) return <p className="text-sm text-stone-600">{dict.orders.empty}</p>;
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id}>
          <OrderCard order={o} viewAs={viewAs} />
        </li>
      ))}
    </ul>
  );
}

function OrderCard({ order, viewAs }: { order: OrderRow; viewAs: "farmer" | "buyer" }) {
  const { dict, locale } = useI18n();
  const o = dict.orders;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const counterpart = viewAs === "farmer" ? order.buyer : order.farmer;
  const open = ["pending", "confirmed", "ready"].includes(order.status);
  const next = viewAs === "farmer" ? NEXT_STEP[order.status] : undefined;
  const nextLabel = { confirmed: o.confirm, ready: o.markReady, completed: o.complete };

  function change(status: string) {
    setError(null);
    startTransition(async () => {
      const res = await apiFetch(`/api/orders/${order.id}`, "PATCH", { status });
      if (res.ok) router.refresh();
      else setError(errorText(dict, res.code));
    });
  }

  return (
    <article className={`${cardCls} space-y-2`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[order.status]}`}>
          {o.status[order.status]}
        </span>
        <span className="text-xs text-stone-500">{t(o.createdAt, { date: formatDateTime(order.created_at, locale) })}</span>
        <span className="ml-auto font-semibold">{o.total}: {formatPrice(Number(order.total), locale)}</span>
      </div>

      {counterpart && (
        <p className="text-sm">
          <span className="text-stone-500">{viewAs === "farmer" ? o.buyer : o.farmer}: </span>
          {counterpart.organization_name ?? counterpart.full_name}
          {counterpart.phone && (
            <>
              {" · "}
              <a className="text-green-800 underline" href={`https://wa.me/${counterpart.phone.replace(/\D/g, "")}`}>
                {counterpart.phone}
              </a>
            </>
          )}
        </p>
      )}

      <ul className="text-sm text-stone-700">
        {order.order_items.map((it, i) => (
          <li key={i}>
            {formatNumber(Number(it.quantity), locale)} {it.listings ? dict.common.units[it.listings.unit] : ""} ·{" "}
            {it.listings?.title} — {formatPrice(Number(it.subtotal), locale)}
          </li>
        ))}
      </ul>

      {order.status === "pending" && order.reserved_until && (
        <p className="text-xs text-amber-800">{t(o.confirmBefore, { date: formatDateTime(order.reserved_until, locale) })}</p>
      )}

      {open && (
        <div className="flex flex-wrap gap-2 pt-1">
          {next && (
            <button disabled={pending} onClick={() => change(next)} className={primaryBtn}>
              {nextLabel[next]}
            </button>
          )}
          <button disabled={pending} onClick={() => change("cancelled")} className={secondaryBtn}>
            {o.cancel}
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </article>
  );
}
