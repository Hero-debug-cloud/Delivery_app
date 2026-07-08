import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetPayrollConfigurations,
  apiGetPayrollConfigurationByStore,
  apiUpsertPayrollConfiguration,
  apiGeneratePayroll,
  apiGetPayrollLedgers,
  apiUpdatePayrollLedger,
  apiDeletePayrollConfiguration,
} from "../api";
import type { 
  GetPayrollLedgersParams, 
  UpsertPayrollConfigInput, 
  GeneratePayrollInput, 
  UpdatePayrollLedgerInput,
  GetPayrollConfigurationsParams
} from "../types";

export function usePayrollConfigurations(params?: GetPayrollConfigurationsParams) {
  const query = useQuery({
    queryKey: ["payroll", "configurations", params],
    queryFn: () => apiGetPayrollConfigurations(params),
  });

  return {
    configurations: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function usePayrollConfigurationByStore(storeId: string | null) {
  const query = useQuery({
    queryKey: ["payroll", "configurations", storeId],
    queryFn: () => apiGetPayrollConfigurationByStore(storeId || "global"),
    enabled: storeId !== undefined,
  });

  return {
    configuration: query.data?.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function usePayrollLedgers(params?: GetPayrollLedgersParams) {
  const query = useQuery({
    queryKey: ["payroll", "ledgers", params],
    queryFn: () => apiGetPayrollLedgers(params),
  });

  return {
    ledgers: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function usePayrollMutations() {
  const queryClient = useQueryClient();

  const upsertConfigMutation = useMutation({
    mutationFn: apiUpsertPayrollConfiguration,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "configurations"] });
      if (res?.data?.storeId) {
        queryClient.invalidateQueries({ queryKey: ["payroll", "configurations", res.data.storeId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["payroll", "configurations", "global"] });
      }
    },
  });

  const generatePayrollMutation = useMutation({
    mutationFn: apiGeneratePayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "ledgers"] });
    },
  });

  const updateLedgerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePayrollLedgerInput }) =>
      apiUpdatePayrollLedger(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "ledgers"] });
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: apiDeletePayrollConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "configurations"] });
    },
  });

  return {
    upsertConfig: upsertConfigMutation.mutateAsync,
    isUpsertingConfig: upsertConfigMutation.isPending,
    
    generatePayroll: generatePayrollMutation.mutateAsync,
    isGeneratingPayroll: generatePayrollMutation.isPending,

    updateLedger: updateLedgerMutation.mutateAsync,
    isUpdatingLedger: updateLedgerMutation.isPending,

    deleteConfig: deleteConfigMutation.mutateAsync,
    isDeletingConfig: deleteConfigMutation.isPending,
  };
}
