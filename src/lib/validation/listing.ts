import { z } from "zod";
import { UNIT_TYPES } from "@/types/domain";

// Centro de Lima como ubicación por defecto
export const DEFAULT_COORDS = { lat: -12.0464, lng: -77.0428 };

export const createListingSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(1000).optional(),
    categoryId: z.number().int().positive().optional(),
    locationId: z.string().uuid(),
    unit: z.enum(UNIT_TYPES),
    pricePerUnit: z.number().nonnegative().max(100_000),
    quantityTotal: z.number().positive().max(1_000_000),
    minOrderQty: z.number().positive().default(1),
    harvestedAt: z.string().date().optional(),
    availableUntil: z.string().datetime({ offset: true }),
    isSurplus: z.boolean().default(false),
    imageUrl: z.string().url(),
  })
  .refine((d) => d.minOrderQty <= d.quantityTotal, {
    path: ["minOrderQty"],
    message: "El pedido mínimo no puede superar la cantidad total",
  })
  .refine((d) => new Date(d.availableUntil) > new Date(), {
    path: ["availableUntil"],
    message: "La fecha límite debe ser futura",
  });

export type CreateListingInput = z.infer<typeof createListingSchema>;

/** Query string del catálogo: /catalogo?lat=..&lng=..&radius=10&category=frutas&surplus=1&q=papa */
export const catalogQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).default(DEFAULT_COORDS.lat),
  lng: z.coerce.number().min(-180).max(180).default(DEFAULT_COORDS.lng),
  radius: z.coerce.number().min(1).max(200).default(50),
  category: z.string().trim().min(1).optional(),
  surplus: z.enum(["0", "1"]).default("0").transform((v) => v === "1"),
  q: z.string().trim().min(1).max(60).optional(),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
