import type { Store, ApiResponse, PaginatedResponse, GetStoresParams, CreateStoreInput, UpdateStoreInput } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message ?? data?.error ?? 'Request failed');
  }
  return data as T;
}

export async function apiGetStores(params?: GetStoresParams): Promise<PaginatedResponse<Store>> {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    if (params.search) searchParams.append('search', params.search);
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  }
  const res = await fetch(`${API}/stores?${searchParams.toString()}`, { credentials: 'include' });
  return handleResponse<PaginatedResponse<Store>>(res);
}

export async function apiGetStoreById(id: string): Promise<ApiResponse<Store>> {
  const res = await fetch(`${API}/stores/${id}`, { credentials: 'include' });
  return handleResponse<ApiResponse<Store>>(res);
}

export async function apiCreateStore(data: CreateStoreInput): Promise<ApiResponse<Store>> {
  const res = await fetch(`${API}/stores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<ApiResponse<Store>>(res);
}

export async function apiUpdateStore(id: string, data: UpdateStoreInput): Promise<ApiResponse<Store>> {
  const res = await fetch(`${API}/stores/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<ApiResponse<Store>>(res);
}

export async function apiDeleteStore(id: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${API}/stores/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse<ApiResponse<null>>(res);
}
