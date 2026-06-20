import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import {
  apiGetProducts,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
  apiGetCategories,
  apiCreateCategory,
  apiUpdateCategory,
  apiDeleteCategory,
  apiGetStores,
  GetProductsParams,
  GetCategoriesParams,
} from "../api";
import type { Product, Category } from "../types";

export function useProducts(params?: GetProductsParams) {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["products", params],
    queryFn: () => apiGetProducts(params),
  });

  const createProductMutation = useMutation({
    mutationFn: apiCreateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-categories"] });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      apiUpdateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-categories"] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: apiDeleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-categories"] });
    },
  });

  return {
    products: productsQuery.data?.data ?? [],
    pagination: productsQuery.data?.pagination,
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    refetch: productsQuery.refetch,
    createProduct: createProductMutation.mutateAsync,
    isCreating: createProductMutation.isPending,
    updateProduct: updateProductMutation.mutateAsync,
    isUpdating: updateProductMutation.isPending,
    deleteProduct: deleteProductMutation.mutateAsync,
    isDeleting: deleteProductMutation.isPending,
  };
}

export function useCategories(params?: GetCategoriesParams) {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["categories", params],
    queryFn: () => apiGetCategories(params),
  });

  const createCategoryMutation = useMutation({
    mutationFn: apiCreateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-categories"] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      apiUpdateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-categories"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: apiDeleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-categories"] });
    },
  });

  return {
    categories: categoriesQuery.data?.data ?? [],
    pagination: categoriesQuery.data?.pagination,
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    refetch: categoriesQuery.refetch,
    createCategory: createCategoryMutation.mutateAsync,
    isCreating: createCategoryMutation.isPending,
    updateCategory: updateCategoryMutation.mutateAsync,
    isUpdating: updateCategoryMutation.isPending,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    isDeleting: deleteCategoryMutation.isPending,
  };
}

export function useStores() {
  const storesQuery = useQuery({
    queryKey: ["stores-list"],
    queryFn: () => apiGetStores({ page: 1, limit: 100 }),
  });

  return {
    stores: storesQuery.data?.data ?? [],
    isLoading: storesQuery.isLoading,
    error: storesQuery.error,
    refetch: storesQuery.refetch,
  };
}

export function useInfiniteCategories(params?: { isActive?: boolean }) {
  const limit = 5;

  const infiniteQuery = useInfiniteQuery({
    queryKey: ["infinite-categories", params],
    queryFn: ({ pageParam }) =>
      apiGetCategories({
        ...params,
        limit,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined;
    },
  });

  const items = infiniteQuery.data
    ? infiniteQuery.data.pages.flatMap((page) => page.data)
    : [];

  return {
    items,
    isLoading: infiniteQuery.isLoading,
    error: infiniteQuery.error,
    fetchNextPage: infiniteQuery.fetchNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
  };
}

export function useInfiniteStores() {
  const limit = 5;

  const infiniteQuery = useInfiniteQuery({
    queryKey: ["infinite-stores"],
    queryFn: ({ pageParam }) =>
      apiGetStores({
        limit,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined;
    },
  });

  const items = infiniteQuery.data
    ? infiniteQuery.data.pages.flatMap((page) => page.data)
    : [];

  return {
    items,
    isLoading: infiniteQuery.isLoading,
    error: infiniteQuery.error,
    fetchNextPage: infiniteQuery.fetchNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
  };
}
