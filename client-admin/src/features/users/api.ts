import type { User, ApiResponse, PaginatedResponse, GetUsersParams, CreateUserInput, UpdateUserInput } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data?.error === 'VALIDATION_ERROR' && data?.details?.fieldErrors) {
      const fieldErrors = data.details.fieldErrors;
      const messages = Object.entries(fieldErrors)
        .map(([field, msgs]) => {
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
          return `${fieldName}: ${(msgs as string[]).join(', ')}`;
        })
        .join('; ');
      throw new Error(`Validation Error — ${messages}`);
    }
    throw new Error(data?.message ?? data?.error ?? 'Request failed');
  }
  return data as T;
}

export async function apiGetUsers(params?: GetUsersParams): Promise<PaginatedResponse<User>> {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    if (params.search) searchParams.append('search', params.search);
    if (params.role) searchParams.append('role', params.role);
    if (params.type) searchParams.append('type', params.type);
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  }
  const res = await fetch(`${API}/users?${searchParams.toString()}`, { credentials: 'include' });
  return handleResponse<PaginatedResponse<User>>(res);
}

export async function apiGetUserById(id: string): Promise<ApiResponse<User>> {
  const res = await fetch(`${API}/users/${id}`, { credentials: 'include' });
  return handleResponse<ApiResponse<User>>(res);
}

export async function apiCreateUser(data: CreateUserInput): Promise<ApiResponse<User>> {
  const res = await fetch(`${API}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<ApiResponse<User>>(res);
}

export async function apiUpdateUser(id: string, data: UpdateUserInput): Promise<ApiResponse<User>> {
  const res = await fetch(`${API}/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<ApiResponse<User>>(res);
}

export async function apiDeleteUser(id: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${API}/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse<ApiResponse<null>>(res);
}
