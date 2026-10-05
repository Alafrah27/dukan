import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "../lib/axios";

export const PRODUCTS_QUERY_KEY = "products";

/**
 * Shared request builder for the products list endpoint
 */
const fetchProducts = async ({ page, limit, categoryId, search, isAvailable }) => {
  const queryParams = new URLSearchParams();
  if (page) queryParams.set("page", page);
  if (limit) queryParams.set("limit", limit);
  if (categoryId) queryParams.set("categoryId", categoryId);
  if (search) queryParams.set("search", search);
  if (isAvailable !== undefined) queryParams.set("isAvailable", isAvailable);

  const response = await api.get(`/products?${queryParams.toString()}`);
  return response.data;
};

/**
 * Fetch products with pagination, search, category filtering
 */
export const useGetProducts = (params = {}) => {
  const { page = 1, limit = 20, categoryId, search, isAvailable } = params;

  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, { page, limit, categoryId, search, isAvailable }],
    queryFn: () => fetchProducts({ page, limit, categoryId, search, isAvailable }),
    staleTime: 1000 * 60 * 3,
  });
};

/**
 * Infinite (paginated-scroll) products list
 */
export const useInfiniteProducts = (params = {}) => {
  const { limit = 10, categoryId, search, isAvailable } = params;

  return useInfiniteQuery({
    queryKey: [PRODUCTS_QUERY_KEY, "infinite", { limit, categoryId, search, isAvailable }],
    queryFn: ({ pageParam }) =>
      fetchProducts({ page: pageParam, limit, categoryId, search, isAvailable }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { currentPage = 1, totalPages = 1 } = lastPage?.pagination || {};
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: 1000 * 60 * 3,
  });
};

/**
 * Fetch single product by ID
 */
export const useGetProductById = (productId) => {
  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, productId],
    queryFn: async () => {
      if (!productId) return null;
      const response = await api.get(`/products/${productId}`);
      return response.data;
    },
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5,
  });
};
