import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "@clerk/react";

const QUERY_KEY = "tailoringPrices";

/**
 * Fetch all tailoring prices with optional filtering, search, pagination
 */
export const useGetTailoringPrices = (params = {}) => {
  const {
    page = 1,
    limit = 20,
    productId,
    sizeType,
    isActive,
    search,
    sortBy,
    order,
  } = params;

  return useQuery({
    queryKey: [
      QUERY_KEY,
      { page, limit, productId, sizeType, isActive, search, sortBy, order },
    ],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (page) queryParams.set("page", page);
      if (limit) queryParams.set("limit", limit);
      if (productId) queryParams.set("productId", productId);
      if (sizeType) queryParams.set("sizeType", sizeType);
      if (isActive !== undefined && isActive !== "") {
        queryParams.set("isActive", isActive);
      }
      if (search) queryParams.set("search", search);
      if (sortBy) queryParams.set("sortBy", sortBy);
      if (order) queryParams.set("order", order);

      const response = await api.get(`/tailoring?${queryParams.toString()}`);
      return response.data;
    },
    staleTime: 1000 * 60, // 1 minute
    keepPreviousData: true,
  });
};

/**
 * Fetch tailoring prices for a specific product
 */
export const useGetProductTailoringPrices = (productId, activeOnly = false) => {
  return useQuery({
    queryKey: [QUERY_KEY, "product", productId, { activeOnly }],
    queryFn: async () => {
      if (!productId) return { tailoringPrices: [] };
      const response = await api.get(
        `/tailoring/product/${productId}?activeOnly=${activeOnly}`
      );
      return response.data;
    },
    enabled: Boolean(productId),
    staleTime: 1000 * 60,
  });
};

/**
 * Create a new tailoring price (Admin only)
 */
export const useCreateTailoringPrice = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      const response = await api.post("/tailoring", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * Update an existing tailoring price (Admin only)
 */
export const useUpdateTailoringPrice = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const token = await getToken();
      const response = await api.put(`/tailoring/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * Toggle tailoring price active state (Admin only)
 */
export const useToggleTailoringPriceStatus = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id) => {
      const token = await getToken();
      const response = await api.patch(
        `/tailoring/${id}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * Delete a tailoring price (Admin only)
 */
export const useDeleteTailoringPrice = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id) => {
      const token = await getToken();
      const response = await api.delete(`/tailoring/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * Bulk upsert tailoring prices for a product (Admin only)
 */
export const useBulkUpsertTailoringPrices = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, prices }) => {
      const token = await getToken();
      const response = await api.post(
        "/tailoring/bulk",
        { productId, prices },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
