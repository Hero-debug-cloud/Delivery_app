import type { Category, Product, Store, ApiResponse, PaginatedResponse } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message ?? data?.error ?? 'Request failed');
  }
  return data as T;
}

// Categories API
export interface GetCategoriesParams {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function apiGetCategories(params?: GetCategoriesParams): Promise<PaginatedResponse<Category>> {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    if (params.search) searchParams.append('search', params.search);
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  }
  const res = await fetch(`${API}/categories?${searchParams.toString()}`, { credentials: 'include' });
  return handleResponse<PaginatedResponse<Category>>(res);
}

export async function apiCreateCategory(data: Partial<Category>): Promise<ApiResponse<Category>> {
  const res = await fetch(`${API}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<ApiResponse<Category>>(res);
}

export async function apiUpdateCategory(id: string, data: Partial<Category>): Promise<ApiResponse<Category>> {
  const res = await fetch(`${API}/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<ApiResponse<Category>>(res);
}

export async function apiDeleteCategory(id: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${API}/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse<ApiResponse<null>>(res);
}

// Products API
export interface GetProductsParams {
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

export async function apiGetProducts(params?: GetProductsParams): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.storeId) searchParams.append('storeId', params.storeId);
    if (params.categoryId) searchParams.append('categoryId', params.categoryId);
    if (params.search) searchParams.append('search', params.search);
    if (params.inStock !== undefined) searchParams.append('inStock', String(params.inStock));
    if (params.isFeatured !== undefined) searchParams.append('isFeatured', String(params.isFeatured));
    if (params.isVeg !== undefined) searchParams.append('isVeg', String(params.isVeg));
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  }
  const res = await fetch(`${API}/products?${searchParams.toString()}`, { credentials: 'include' });
  return handleResponse<PaginatedResponse<Product>>(res);
}

export async function apiCreateProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
  const res = await fetch(`${API}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<ApiResponse<Product>>(res);
}

export async function apiUpdateProduct(id: string, data: Partial<Product>): Promise<ApiResponse<Product>> {
  const res = await fetch(`${API}/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<ApiResponse<Product>>(res);
}

export async function apiDeleteProduct(id: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${API}/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse<ApiResponse<null>>(res);
}

// Stores API (for select dropdowns)
export async function apiGetStores(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Store>> {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
  }
  const res = await fetch(`${API}/stores?${searchParams.toString()}`, { credentials: 'include' });
  return handleResponse<PaginatedResponse<Store>>(res);
}
