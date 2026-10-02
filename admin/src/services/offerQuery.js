import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "@clerk/react";

const QUERY_KEY = "offers";

/**
 * Fetch offers with filtering, status tabs, search & pagination
 */
export const useGetOffers = (params = {}) => {
  const {
    page = 1,
    limit = 10,
    status = "all",
    type,
    search,
    productId,
  } = params;

  return useQuery({
    queryKey: [QUERY_KEY, { page, limit, status, type, search, productId }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set("page", page);
      queryParams.set("limit", limit);
      if (status && status !== "all") queryParams.set("status", status);
      if (type && type !== "all") queryParams.set("type", type);
      if (search) queryParams.set("search", search);
      if (productId) queryParams.set("productId", productId);

      const response = await api.get(`/offers?${queryParams.toString()}`);
      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Create a new offer (admin only)
 */
export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      const response = await api.post("/offers", payload, {
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
 * Update an existing offer (admin only)
 */
export const useUpdateOffer = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ offerId, ...payload }) => {
      const token = await getToken();
      const response = await api.put(`/offers/${offerId}`, payload, {
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
 * Toggle offer isActive status (admin only)
 */
export const useToggleOfferStatus = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (offerId) => {
      const token = await getToken();
      const response = await api.patch(
        `/offers/${offerId}/toggle`,
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
 * Delete an offer (admin only)
 */
export const useDeleteOffer = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (offerId) => {
      const token = await getToken();
      const response = await api.delete(`/offers/${offerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
