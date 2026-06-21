import type { DeliveryPartner, ApiResponse, PaginatedResponse, GetDriversParams, CreateDriverInput } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message ?? data?.error ?? 'Request failed');
  }
  return data as T;
}

export async function apiGetDeliveryPartners(params?: GetDriversParams): Promise<PaginatedResponse<DeliveryPartner>> {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.onboardingStatus) searchParams.append('onboardingStatus', params.onboardingStatus);
    if (params.search) searchParams.append('search', params.search);
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
  }
  const res = await fetch(`${API}/delivery-partners?${searchParams.toString()}`, { credentials: 'include' });
  return handleResponse<PaginatedResponse<DeliveryPartner>>(res);
}

export async function apiApproveDriver(id: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${API}/delivery-partners/${id}/approve`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse<ApiResponse<null>>(res);
}

export async function apiRejectDriver(id: string, reason: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${API}/delivery-partners/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  return handleResponse<ApiResponse<null>>(res);
}

export async function apiCreateDriver(data: CreateDriverInput): Promise<ApiResponse<{ id: string }>> {
  const res = await fetch(`${API}/delivery-partners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<ApiResponse<{ id: string }>>(res);
}
