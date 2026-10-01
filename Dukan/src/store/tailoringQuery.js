import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";

export const TAILORING_QUERY_KEY = "tailoring";

/**
 * Fetch active tailoring prices for a specific product
 */
export const useGetProductTailoringPrices = (productId) => {
  return useQuery({
    queryKey: [TAILORING_QUERY_KEY, "product", productId],
    queryFn: async () => {
      if (!productId) return { tailoringPrices: [] };
      const response = await api.get(
        `/tailoring/product/${productId}?activeOnly=true`
      );
      return response.data;
    },
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5,
  });
};
