import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";

export const CART_QUERY_KEY = "cart";

/**
 * Hook to get customer cart
 */
export const useGetCart = () => {
  return useQuery({
    queryKey: [CART_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get("/cart");
      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Hook to add item to cart (supports tailoring selection & measurements)
 */
export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/cart", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
    },
  });
};

/**
 * Hook to update cart item
 */
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.put("/cart/item", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
    },
  });
};

/**
 * Hook to update cart address
 */
export const useUpdateCartAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId) => {
      const response = await api.put("/cart/address", { addressId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
    },
  });
};

/**
 * Hook to delete item from cart
 */
export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId) => {
      const response = await api.delete(`/cart/item/${productId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
    },
  });
};

/**
 * Hook to clear customer cart
 */
export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete("/cart");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
    },
  });
};
