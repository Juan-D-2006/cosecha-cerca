"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { apiFetch, errorText } from "@/lib/api";
import { categoryName } from "@/lib/format";
import { inputCls, labelCls, primaryBtn } from "@/components/ui";
import { UNIT_TYPES } from "@/types/domain";

interface Props {
  locations: { id: string; label: string }[];
  categories: { id: number; slug: string; name: string }[];
}

/** Valor por defecto para <input type="datetime-local">: dentro de 3 días */
function defaultUntil() {
  const d = new Date(Date.now() + 3 * 86_400_000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function ListingForm({ locations, categories }: Props) {
  const { dict } = useI18n();
  const p = dict.panel;
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const f = new FormData(formEl);
    const num = (k: string) => Number(f.get(k));
    setPending(true);
    const res = await apiFetch("/api/listings", "POST", {
      title: f.get("title"),
      description: f.get("description") || undefined,
      categoryId: f.get("categoryId") ? num("categoryId") : undefined,
      locationId: f.get("locationId"),
      unit: f.get("unit"),
      pricePerUnit: num("pricePerUnit"),
      quantityTotal: num("quantityTotal"),
      minOrderQty: num("minOrderQty"),
      harvestedAt: f.get("harvestedAt") || undefined,
      availableUntil: new Date(String(f.get("availableUntil"))).toISOString(),
      isSurplus: f.get("isSurplus") === "on",
    });
    setPending(false);
    if (res.ok) {
      formEl.reset();
      setMessage({ ok: true, text: p.published });
      router.refresh();
    } else {
      setMessage({ ok: false, text: errorText(dict, res.code) });
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className={`${labelCls} sm:col-span-2`}>
        {p.listingTitle}
        <input name="title" required minLength={3} maxLength={120} placeholder={p.listingTitlePlaceholder} className={inputCls} />
      </label>
      <label className={labelCls}>
        {dict.catalog.category}
        <select name="categoryId" className={inputCls}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{categoryName(c.slug, c.name, dict)}</option>
          ))}
        </select>
      </label>
      <label className={`${labelCls} sm:col-span-2 lg:col-span-3`}>
        {p.description}
        <input name="description" maxLength={1000} className={inputCls} />
      </label>
      <label className={labelCls}>
        {p.unit}
        <select name="unit" className={inputCls}>
          {UNIT_TYPES.map((u) => (
            <option key={u} value={u}>{dict.common.units[u]}</option>
          ))}
        </select>
      </label>
      <label className={labelCls}>
        {p.price}
        <input name="pricePerUnit" type="number" min={0} step="0.01" required className={inputCls} />
      </label>
      <label className={labelCls}>
        {p.quantity}
        <input name="quantityTotal" type="number" min={0.01} step="any" required className={inputCls} />
      </label>
      <label className={labelCls}>
        {p.minOrder}
        <input name="minOrderQty" type="number" min={0.01} step="any" defaultValue={1} required className={inputCls} />
      </label>
      <label className={labelCls}>
        {p.harvestedAt}
        <input name="harvestedAt" type="date" className={inputCls} />
      </label>
      <label className={labelCls}>
        {p.availableUntil}
        <input name="availableUntil" type="datetime-local" required defaultValue={defaultUntil()} className={inputCls} />
      </label>
      <label className={labelCls}>
        {p.location}
        <select name="locationId" required className={inputCls}>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input name="isSurplus" type="checkbox" />
        {p.isSurplus}
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
        <button disabled={pending} className={primaryBtn}>{pending ? dict.common.saving : p.publish}</button>
        {message && (
          <p role="status" className={`text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>
        )}
      </div>
    </form>
  );
}
