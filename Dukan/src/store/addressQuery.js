import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { CART_QUERY_KEY } from "./cartQuery";

export const ADDRESS_QUERY_KEY = "addresses";

/**
 * Hook to get user delivery addresses
 */
export const useGetAddresses = () => {
  return useQuery({
    queryKey: [ADDRESS_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get("/address");
      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Hook to create a new address
 */
export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/address", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADDRESS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
    },
  });
};

/**
 * Hook to update an existing address
 */
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ addressId, ...payload }) => {
      const response = await api.put(`/address/${addressId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADDRESS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
    },
  });
};

/**
 * Hook to set an address as default
 */
export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId) => {
      const response = await api.put(`/address/${addressId}/default`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADDRESS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
    },
  });
};

/**
 * Hook to delete an address
 */
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId) => {
      const response = await api.delete(`/address/${addressId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADDRESS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
    },
  });
};
