import { z } from "zod";

export const createLocationSchema = z.object({
  label: z.string().trim().min(2).max(80),
  district: z.string().trim().max(80).optional(),
  address: z.string().trim().max(200).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
