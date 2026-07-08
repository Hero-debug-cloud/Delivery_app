import type { 
  PayrollConfiguration, 
  PayrollLedger, 
  UpsertPayrollConfigInput, 
  GeneratePayrollInput, 
  UpdatePayrollLedgerInput, 
  GetPayrollLedgersParams,
  GetPayrollConfigurationsParams
} from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<{ success: boolean; message: string; data: T; pagination?: any }> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message ?? data?.error ?? 'Request failed');
  }
  return data;
}

export async function apiGetPayrollConfigurations(params?: GetPayrollConfigurationsParams): Promise<{ 
  success: boolean; 
  data: PayrollConfiguration[]; 
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.search) searchParams.append("search", params.search);

  const res = await fetch(`${API}/payroll/configurations?${searchParams.toString()}`, {
    credentials: "include",
  });
  return handleResponse<any>(res) as any;
}

export async function apiGetPayrollConfigurationByStore(storeId: string): Promise<{ success: boolean; data: PayrollConfiguration }> {
  const res = await fetch(`${API}/payroll/configurations/${storeId}`, { credentials: 'include' });
  return handleResponse<PayrollConfiguration>(res);
}

export async function apiUpsertPayrollConfiguration(data: UpsertPayrollConfigInput): Promise<{ success: boolean; data: PayrollConfiguration }> {
  const res = await fetch(`${API}/payroll/configurations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<PayrollConfiguration>(res);
}

export async function apiGeneratePayroll(data: GeneratePayrollInput): Promise<{ success: boolean; message: string; data: { generatedCount: number } }> {
  const res = await fetch(`${API}/payroll/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<{ generatedCount: number }>(res);
}

export async function apiGetPayrollLedgers(params?: GetPayrollLedgersParams): Promise<{ success: boolean; data: PayrollLedger[]; pagination: any }> {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.storeId) searchParams.append('storeId', params.storeId);
    if (params.driverId) searchParams.append('driverId', params.driverId);
    if (params.status) searchParams.append('status', params.status);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
    if (params.search) searchParams.append('search', params.search);
  }
  const res = await fetch(`${API}/payroll/ledgers?${searchParams.toString()}`, { credentials: 'include' });
  return handleResponse<PayrollLedger[]>(res) as any;
}

export async function apiUpdatePayrollLedger(id: string, data: UpdatePayrollLedgerInput): Promise<{ success: boolean; data: PayrollLedger }> {
  const res = await fetch(`${API}/payroll/ledgers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<PayrollLedger>(res);
}

export function getExportPayrollLedgersUrl(params: { storeId?: string; startDate?: string; endDate?: string }): string {
  const searchParams = new URLSearchParams();
  if (params.storeId) searchParams.append('storeId', params.storeId);
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);
  return `${API}/payroll/ledgers/export?${searchParams.toString()}`;
}

export async function apiDeletePayrollConfiguration(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API}/payroll/configurations/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse<any>(res);
}

