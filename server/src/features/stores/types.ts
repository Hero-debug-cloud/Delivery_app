import { z } from "zod";

export const createStoreSchema = z.object({
  name: z.string().min(1, "Store name is required").max(100),
  address: z.string().min(1, "Address is required"),
  latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  phone: z.string().min(1, "Contact phone is required"),
  isActive: z.boolean().optional().default(true),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Opening time must be in HH:MM format"),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Closing time must be in HH:MM format"),
});

export const updateStoreSchema = createStoreSchema.partial();

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;

export interface GetStoresFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
