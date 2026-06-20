import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetDeliveryPartners,
  apiApproveDriver,
  apiRejectDriver,
} from "../api";
import type { GetDriversParams } from "../types";

export function useDeliveryPartners(params?: GetDriversParams) {
  const queryClient = useQueryClient();

  const driversQuery = useQuery({
    queryKey: ["delivery-partners", params],
    queryFn: () => apiGetDeliveryPartners(params),
  });

  const approveDriverMutation = useMutation({
    mutationFn: apiApproveDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-partners"] });
    },
  });

  const rejectDriverMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiRejectDriver(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-partners"] });
    },
  });

  return {
    drivers: driversQuery.data?.data ?? [],
    pagination: driversQuery.data?.pagination,
    isLoading: driversQuery.isLoading,
    error: driversQuery.error,
    refetch: driversQuery.refetch,
    approveDriver: approveDriverMutation.mutateAsync,
    isApproving: approveDriverMutation.isPending,
    rejectDriver: rejectDriverMutation.mutateAsync,
    isRejecting: rejectDriverMutation.isPending,
  };
}
