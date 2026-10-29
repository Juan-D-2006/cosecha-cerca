import type { Dictionary } from "@/i18n/dictionaries";

type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string };

/** fetch JSON desde componentes de cliente, con errores normalizados */
export async function apiFetch<T = unknown>(url: string, method: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: json.data as T };
    const code =
      typeof json.code === "string" ? json.code :
      res.status === 401 ? "not_authenticated" :
      res.status === 400 ? "invalid" : "generic";
    return { ok: false, status: res.status, code };
  } catch {
    return { ok: false, status: 0, code: "generic" };
  }
}

export const errorText = (dict: Dictionary, code: string) =>
  (dict.errors as Record<string, string>)[code] ?? dict.errors.generic;
