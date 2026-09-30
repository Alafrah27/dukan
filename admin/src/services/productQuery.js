import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "@clerk/react";

const QUERY_KEY = "products";

/**
 * Fetch products with server-side filtering, search & pagination
 */
export const useGetProducts = (params = {}) => {
  const { page = 1, limit = 10, categoryId, search, isAvailable } = params;

  return useQuery({
    queryKey: [QUERY_KEY, { page, limit, categoryId, search, isAvailable }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set("page", page);
      queryParams.set("limit", limit);
      if (categoryId) queryParams.set("categoryId", categoryId);
      if (search) queryParams.set("search", search);
      if (isAvailable !== undefined && isAvailable !== "")
        queryParams.set("isAvailable", isAvailable);

      const response = await api.get(`/products?${queryParams.toString()}`);
      return response.data;
    },
    staleTime: 1000 * 60,
    keepPreviousData: true,
  });
};

/**
 * Create a new product (admin only)
 * Sends FormData for multer multi-image upload
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (formData) => {
      const token = await getToken();
      const response = await api.post("/products", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * Update a product (admin only)
 * Sends FormData for multer multi-image upload
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, formData }) => {
      const token = await getToken();
      const response = await api.put(`/products/${productId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * Delete a product (admin only)
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (productId) => {
      const token = await getToken();
      const response = await api.delete(`/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
