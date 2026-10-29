"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { apiFetch, errorText } from "@/lib/api";
import { categoryName } from "@/lib/format";
import { inputCls, labelCls, primaryBtn } from "@/components/ui";
import { UNIT_TYPES } from "@/types/domain";
import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/resizeImage";

const BUCKET = "product-images";

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
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Vista previa local de la foto elegida
  useEffect(() => {
    if (!photo) return setPreview(null);
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  /** Sube la foto a Supabase Storage en la carpeta del agricultor y devuelve su URL pública */
  async function uploadPhoto(file: File): Promise<string | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const blob = await resizeImage(file);
    const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "31536000" });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const f = new FormData(formEl);
    const num = (k: string) => Number(f.get(k));
    if (!photo) return setMessage({ ok: false, text: p.photoRequired });
    setPending(true);
    setMessage(null);
    setUploading(true);
    const imageUrl = await uploadPhoto(photo);
    setUploading(false);
    if (!imageUrl) {
      setPending(false);
      return setMessage({ ok: false, text: dict.errors.upload_failed });
    }
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
      imageUrl,
    });
    setPending(false);
    if (res.ok) {
      formEl.reset();
      setPhoto(null);
      setMessage({ ok: true, text: p.published });
      router.refresh();
    } else {
      setMessage({ ok: false, text: errorText(dict, res.code) });
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="sm:col-span-2 lg:col-span-3">
        <span className={labelCls}>{p.photo}</span>
        <label className="mt-1.5 flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-3 transition-colors duration-150 hover:border-clay-400 hover:bg-clay-50/50 has-[:focus-visible]:border-clay-500">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-24 w-32 rounded-xl object-cover shadow-md" />
          ) : (
            <span className="grid h-24 w-32 place-items-center rounded-xl bg-amber-50 text-amber-700" aria-hidden>
              <Camera className="h-8 w-8" strokeWidth={1.75} />
            </span>
          )}
          <span className="text-sm">
            <span className="font-medium text-green-800">{preview ? p.changePhoto : p.photo}</span>
            <span className="block text-stone-600">{p.photoHint}</span>
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="sr-only"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
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
        <button disabled={pending} className={primaryBtn}>{uploading ? p.uploadingPhoto : pending ? dict.common.saving : p.publish}</button>
        {message && (
          <p role="status" className={`text-sm ${message.ok ? "text-green-700" : "text-clay-700"}`}>{message.text}</p>
        )}
      </div>
    </form>
  );
}
