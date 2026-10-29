import { NextResponse } from "next/server";

/** Códigos de error estables que el frontend traduce (ver dict.errors) */
export type ErrorCode =
  | "insufficient_stock" | "unavailable" | "min_qty" | "only_buyers" | "only_farmer"
  | "invalid_transition" | "not_authenticated" | "forbidden" | "invalid" | "generic";

const PATTERNS: [RegExp, ErrorCode][] = [
  [/Stock insuficiente/i, "insufficient_stock"],
  [/ya no está disponible/i, "unavailable"],
  [/cantidad mínima/i, "min_qty"],
  [/Solo los compradores/i, "only_buyers"],
  [/Solo el agricultor/i, "only_farmer"],
  [/Transición inválida|ya está cerrado/i, "invalid_transition"],
  [/No autenticado/i, "not_authenticated"],
  [/row-level security|permission denied/i, "forbidden"],
];

export function errorResponse(code: ErrorCode, status: number, message?: string) {
  return NextResponse.json({ error: message ?? code, code }, { status });
}

/** Traduce errores de Postgres/PostgREST a HTTP + código estable. */
export function dbErrorResponse(error: { code?: string; message: string }) {
  const code = PATTERNS.find(([re]) => re.test(error.message))?.[1] ?? "generic";
  const status =
    error.code === "28000" ? 401 :
    error.code === "42501" ? 403 :
    error.code === "P0001" ? 409 :
    400;
  return errorResponse(code, status, error.message);
}
