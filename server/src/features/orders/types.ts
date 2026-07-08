import { z } from "zod";

export const createOrderSchema = z.object({
  storeId: z.string().uuid("Invalid store ID format"),
  addressId: z.string().uuid("Invalid address ID format"),
  paymentType: z.enum(["prepaid", "cod"]),
  externalOrderId: z.string().min(1, "External Order ID (idempotency key) is required"),
  items: z.array(
    z.object({
      productId: z.string().uuid("Invalid product ID format"),
      quantity: z.number().int().positive("Quantity must be a positive integer"),
    })
  ).min(1, "Order must contain at least one item"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export interface OrderQueryFilters {
  page?: number;
  limit?: number;
  status?: string;
  storeId?: string;
  search?: string;
}
