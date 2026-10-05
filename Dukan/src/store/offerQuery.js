import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";

export const OFFERS_QUERY_KEY = "offers";

/**
 * Fetch currently active offers for the storefront (public endpoint)
 */
export const useGetActiveOffers = () => {
  return useQuery({
    queryKey: [OFFERS_QUERY_KEY, "active"],
    queryFn: async () => {
      const response = await api.get("/offers/active");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
