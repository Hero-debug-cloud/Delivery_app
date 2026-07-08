export interface Store {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  isActive: boolean;
  openingTime: string;
  closingTime: string;
  catchmentPolygon?: string | null;
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

export interface GetStoresParams {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateStoreInput {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  isActive?: boolean;
  openingTime: string;
  closingTime: string;
  catchmentPolygon?: string | null;
}

export type UpdateStoreInput = Partial<CreateStoreInput>;
