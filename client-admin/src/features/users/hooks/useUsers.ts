import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetUsers,
  apiGetUserById,
  apiCreateUser,
  apiUpdateUser,
  apiDeleteUser,
} from "../api";
import type { GetUsersParams, CreateUserInput, UpdateUserInput } from "../types";

export function useUsers(params?: GetUsersParams) {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users", params],
    queryFn: () => apiGetUsers(params),
  });

  const createUserMutation = useMutation({
    mutationFn: apiCreateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      apiUpdateUser(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (response?.data?.id) {
        queryClient.invalidateQueries({ queryKey: ["users", response.data.id] });
      }
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: apiDeleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return {
    users: usersQuery.data?.data ?? [],
    pagination: usersQuery.data?.pagination,
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    refetch: usersQuery.refetch,
    
    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
    
    updateUser: updateUserMutation.mutateAsync,
    isUpdating: updateUserMutation.isPending,
    
    deleteUser: deleteUserMutation.mutateAsync,
    isDeleting: deleteUserMutation.isPending,
  };
}

export function useUserDetails(id: string) {
  const userQuery = useQuery({
    queryKey: ["users", id],
    queryFn: () => apiGetUserById(id),
    enabled: !!id,
  });

  return {
    user: userQuery.data?.data ?? null,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
    refetch: userQuery.refetch,
  };
}
