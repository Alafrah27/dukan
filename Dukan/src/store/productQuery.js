import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";

export const PRODUCTS_QUERY_KEY = "products";

/**
 * Fetch products with pagination, search, category filtering
 */
export const useGetProducts = (params = {}) => {
  const { page = 1, limit = 20, categoryId, search, isAvailable } = params;

  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, { page, limit, categoryId, search, isAvailable }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (page) queryParams.set("page", page);
      if (limit) queryParams.set("limit", limit);
      if (categoryId) queryParams.set("categoryId", categoryId);
      if (search) queryParams.set("search", search);
      if (isAvailable !== undefined) queryParams.set("isAvailable", isAvailable);

      const response = await api.get(`/products?${queryParams.toString()}`);
      return response.data;
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
