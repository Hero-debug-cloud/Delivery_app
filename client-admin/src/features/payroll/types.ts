export interface PayrollConfiguration {
  id: string;
  storeId: string | null;
  storeName?: string | null;
  perOrderRate: number;
  perKmRate: number;
  nightSurgeRate: number;
  weatherSurgeRate: number;
  latePenalty: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollLedger {
  id: string;
  driverId: string;
  driverName?: string;
  driverPhone?: string;
  storeId: string;
  storeName?: string;
  startDate: string;
  endDate: string;
  totalDeliveries: number;
  totalDistanceMeters: number;
  baseOrderEarnings: number;
  distanceEarnings: number;
  bonusEarnings: number;
  penaltyDeductions: number;
  netPayout: number;
  status: 'draft' | 'approved' | 'hold' | 'paid';
  paymentReference?: string | null;
  createdAt: string;
}

export interface UpsertPayrollConfigInput {
  storeId?: string | null;
  perOrderRate: number;
  perKmRate: number;
  nightSurgeRate: number;
  weatherSurgeRate: number;
  latePenalty: number;
}

export interface GeneratePayrollInput {
  storeId: string;
  startDate: string;
  endDate: string;
}

export interface UpdatePayrollLedgerInput {
  status?: 'draft' | 'approved' | 'hold' | 'paid';
  paymentReference?: string | null;
}

export interface GetPayrollLedgersParams {
  storeId?: string;
  driverId?: string;
  status?: 'draft' | 'approved' | 'hold' | 'paid' | '';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetPayrollConfigurationsParams {
  page?: number;
  limit?: number;
  search?: string;
}

