// Tipos de dominio. Tras conectar Supabase, genera los tipos completos con `npm run db:types`.
export const UNIT_TYPES = ["kg", "unit", "box", "bunch", "liter"] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export type UserRole = "farmer" | "buyer" | "admin";
export type BuyerType = "market" | "restaurant" | "community_kitchen" | "other";
export type OrderStatus = "pending" | "confirmed" | "ready" | "completed" | "cancelled" | "expired";

/** Fila devuelta por la función SQL `nearby_listings`. */
export interface NearbyListing {
  id: string;
  title: string;
  description: string | null;
  category_slug: string | null;
  category_name: string | null;
  unit: UnitType;
  price_per_unit: number;
  quantity_available: number;
  min_order_qty: number;
  available_until: string;
  is_surplus: boolean;
  image_url: string | null;
  farmer_id: string;
  farmer_name: string;
  district: string | null;
  distance_km: number;
}

export interface Category {
  slug: string;
  name: string;
}

export type ListingStatus = "active" | "sold_out" | "expired" | "paused";

export interface OrderItemRow {
  quantity: number;
  unit_price: number;
  subtotal: number;
  listings: { title: string; unit: UnitType } | null;
}

export interface Party {
  full_name: string;
  organization_name: string | null;
  phone: string | null;
}

export interface OrderRow {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  reserved_until: string | null;
  notes: string | null;
  buyer?: Party | null;
  farmer?: Party | null;
  order_items: OrderItemRow[];
}
