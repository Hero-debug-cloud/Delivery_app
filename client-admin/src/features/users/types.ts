export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "super_admin" | "store_manager" | "dispatcher" | "delivery_partner" | "customer";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface GetUsersParams {
  role?: string;
  type?: "staff" | "customer" | "driver";
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateUserInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  password?: string | null;
  role: "super_admin" | "store_manager" | "dispatcher" | "delivery_partner" | "customer";
  isActive?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  password?: string | null;
  role?: "super_admin" | "store_manager" | "dispatcher" | "delivery_partner" | "customer";
  isActive?: boolean;
}
