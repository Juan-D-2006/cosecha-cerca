"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { apiFetch, errorText } from "@/lib/api";
import { t } from "@/lib/format";
import { inputCls, labelCls, primaryBtn, secondaryBtn } from "@/components/ui";

export function LocationForm() {
  const { dict } = useI18n();
  const p = dict.panel;
  const router = useRouter();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  function locate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setLocating(false);
        setCoords({ lat: Number(c.latitude.toFixed(5)), lng: Number(c.longitude.toFixed(5)) });
      },
      () => {
        setLocating(false);
        setMessage({ ok: false, text: dict.errors.generic });
      },
      { timeout: 10_000 },
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!coords) return setMessage({ ok: false, text: p.gpsRequired });
    const formEl = e.currentTarget;
    const f = new FormData(formEl);
    setPending(true);
    const res = await apiFetch("/api/locations", "POST", {
      label: f.get("label"),
      district: f.get("district") || undefined,
      address: f.get("address") || undefined,
      ...coords,
    });
    setPending(false);
    if (res.ok) {
      formEl.reset();
      setCoords(null);
      setMessage({ ok: true, text: p.locationSaved });
      router.refresh();
    } else {
      setMessage({ ok: false, text: errorText(dict, res.code) });
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <label className={labelCls}>
        {p.label}
        <input name="label" required minLength={2} placeholder={p.labelPlaceholder} className={inputCls} />
      </label>
      <label className={labelCls}>
        {p.district}
        <input name="district" className={inputCls} />
      </label>
      <label className={`${labelCls} sm:col-span-2`}>
        {p.address}
        <input name="address" className={inputCls} />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="button" onClick={locate} disabled={locating} className={secondaryBtn}>
          {locating ? dict.catalog.locating : p.useGps}
        </button>
        {coords && <span className="text-sm text-green-700">{t(p.gpsReady, coords)}</span>}
        <button disabled={pending} className={`${primaryBtn} ml-auto`}>{p.addLocation}</button>
      </div>
      {message && (
        <p role="status" className={`text-sm sm:col-span-2 ${message.ok ? "text-green-700" : "text-red-700"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
