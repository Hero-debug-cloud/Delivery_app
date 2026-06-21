import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format").optional().nullable(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15).optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().nullable(),
  role: z.enum(["super_admin", "store_manager", "dispatcher", "delivery_partner", "customer"]),
  isActive: z.boolean().optional().default(true),
}).refine((data) => {
  // Require password if they are creating an admin/manager/dispatcher role
  if (["super_admin", "store_manager", "dispatcher"].includes(data.role)) {
    return !!data.password && data.password.length >= 6;
  }
  return true;
}, {
  message: "Password is required for admin/manager/dispatcher roles",
  path: ["password"],
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  email: z.string().email("Invalid email format").optional().nullable(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15).optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().nullable(),
  role: z.enum(["super_admin", "store_manager", "dispatcher", "delivery_partner", "customer"]).optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export interface GetUsersFilters {
  role?: string;
  type?: "staff" | "customer" | "driver";
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
