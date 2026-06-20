import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createProductSchema = z.object({
  storeId: z.string().uuid("Invalid store ID"),
  name: z.string().min(1, "Product name is required").max(100),
  description: z.string().optional().nullable(),
  price: z.number().int().nonnegative("Price must be a non-negative integer in paisa"),
  unitSize: z.string().min(1, "Unit size is required"),
  categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isFeatured: z.boolean().optional().default(false),
  isVeg: z.boolean().optional().default(true),
  inStock: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export interface GetProductsFilters {
  storeId?: string;
  categoryId?: string;
  search?: string;
  inStock?: boolean;
  isFeatured?: boolean;
  isVeg?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetCategoriesFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
