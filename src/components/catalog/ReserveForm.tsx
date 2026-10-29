"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingBasket } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { apiFetch, errorText } from "@/lib/api";
import { t } from "@/lib/format";

interface Props {
  listingId: string;
  min: number;
  max: number;
  unitLabel: string;
}

const stepBtn =
  "grid h-9 w-9 place-items-center rounded-full text-stone-700 transition-[background-color,transform] duration-100 hover:bg-stone-200 active:scale-90 disabled:opacity-40";

export function ReserveForm({ listingId, min, max, unitLabel }: Props) {
  const { dict } = useI18n();
  const router = useRouter();
  const [quantity, setQuantity] = useState(min);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const step = min >= 1 ? 1 : min;
  const valid = quantity >= min && quantity <= max;

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
      className="mt-3 border-t border-stone-200 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(reserve);
      }}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-full bg-stone-100 p-0.5">
          <button
            type="button"
            className={stepBtn}
            aria-label={dict.catalog.decrease}
            disabled={quantity - step < min}
            onClick={() => setQuantity((q) => Math.max(min, +(q - step).toFixed(2)))}
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
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
            className="tabular w-12 bg-transparent text-center text-sm font-semibold text-stone-900 [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            className={stepBtn}
            aria-label={dict.catalog.increase}
            disabled={quantity + step > max}
            onClick={() => setQuantity((q) => Math.min(max, +(q + step).toFixed(2)))}
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <span className="text-sm text-stone-600">{unitLabel}</span>
        <button
          type="submit"
          disabled={pending || !valid}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-stone-50 shadow-[0_6px_16px_-8px_rgb(33_63_28/0.7)] transition-[background-color,transform] duration-150 hover:bg-green-800 active:scale-[0.96] disabled:opacity-50"
        >
          <ShoppingBasket className="h-4 w-4" aria-hidden />
          {pending ? dict.catalog.reserving : dict.catalog.reserve}
        </button>
      </div>
      {message && (
        <p
          role="status"
          className={`mt-3 flex items-start gap-1.5 rounded-xl px-3 py-2 text-sm ${
            message.ok ? "bg-green-50 text-green-800" : "bg-clay-50 text-clay-700"
          }`}
        >
          {message.ok && <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
          {message.text}
        </p>
      )}
    </form>
  );
}
