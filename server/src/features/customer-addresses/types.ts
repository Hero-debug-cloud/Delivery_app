import { z } from "zod";

export const createAddressSchema = z.object({
  label: z.string().min(1, "Label is required (e.g. Home, Work)").max(50),
  address: z.string().min(1, "Address details are required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isDefault: z.boolean().optional().default(false),
  recipientName: z.string().optional().nullable(),
  recipientPhone: z.string().optional().nullable(),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
