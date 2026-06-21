import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetStores,
  apiGetStoreById,
  apiCreateStore,
  apiUpdateStore,
  apiDeleteStore,
} from "../api";
import type { GetStoresParams, CreateStoreInput, UpdateStoreInput } from "../types";

export function useStores(params?: GetStoresParams) {
  const queryClient = useQueryClient();

  const storesQuery = useQuery({
    queryKey: ["stores", params],
    queryFn: () => apiGetStores(params),
  });

  const createStoreMutation = useMutation({
    mutationFn: apiCreateStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoreInput }) =>
      apiUpdateStore(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      if (response?.data?.id) {
        queryClient.invalidateQueries({ queryKey: ["stores", response.data.id] });
      }
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: apiDeleteStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });

  return {
    stores: storesQuery.data?.data ?? [],
    pagination: storesQuery.data?.pagination,
    isLoading: storesQuery.isLoading,
    error: storesQuery.error,
    refetch: storesQuery.refetch,
    
    createStore: createStoreMutation.mutateAsync,
    isCreating: createStoreMutation.isPending,
    
    updateStore: updateStoreMutation.mutateAsync,
    isUpdating: updateStoreMutation.isPending,
    
    deleteStore: deleteStoreMutation.mutateAsync,
    isDeleting: deleteStoreMutation.isPending,
  };
}

export function useStoreDetails(id: string) {
  const storeQuery = useQuery({
    queryKey: ["stores", id],
    queryFn: () => apiGetStoreById(id),
    enabled: !!id,
  });

  return {
    store: storeQuery.data?.data ?? null,
    isLoading: storeQuery.isLoading,
    error: storeQuery.error,
    refetch: storeQuery.refetch,
  };
}
