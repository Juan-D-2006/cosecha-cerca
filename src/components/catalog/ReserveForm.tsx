"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { apiFetch, errorText } from "@/lib/api";
import { t } from "@/lib/format";

interface Props {
  listingId: string;
  min: number;
  max: number;
  unitLabel: string;
}

export function ReserveForm({ listingId, min, max, unitLabel }: Props) {
  const { dict } = useI18n();
  const router = useRouter();
  const [quantity, setQuantity] = useState(min);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  async function reserve() {
    setMessage(null);
    const res = await apiFetch("/api/orders", "POST", { items: [{ listingId, quantity }] });
    if (res.ok) {
      setMessage({ ok: true, text: dict.catalog.reserved });
      router.refresh(); // actualiza el stock mostrado
    } else if (res.status === 401) {
      router.push("/login?next=/catalogo");
    } else {
      setMessage({ ok: false, text: errorText(dict, res.code) });
    }
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2 pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(reserve);
      }}
    >
      <label className="sr-only" htmlFor={`qty-${listingId}`}>
        {t(dict.catalog.quantityIn, { unit: unitLabel })}
      </label>
      <input
        id={`qty-${listingId}`}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step="any"
        value={Number.isNaN(quantity) ? "" : quantity}
        onChange={(e) => setQuantity(e.target.valueAsNumber)}
        className="w-20 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
      />
      <span className="text-sm text-stone-600">{unitLabel}</span>
      <button
        type="submit"
        disabled={pending || !(quantity >= min && quantity <= max)}
        className="ml-auto rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
      >
        {pending ? dict.catalog.reserving : dict.catalog.reserve}
      </button>
      {message && (
        <p role="status" className={`basis-full text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
