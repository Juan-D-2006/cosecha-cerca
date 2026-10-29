import { z } from "zod";

export const createOrderSchema = z.object({
  items: z
    .array(z.object({ listingId: z.string().uuid(), quantity: z.number().positive() }))
    .min(1)
    .max(30),
  fulfillment: z.enum(["pickup", "delivery"]).default("pickup"),
  pickupAt: z.string().datetime({ offset: true }).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["confirmed", "ready", "completed", "cancelled"]),
});
