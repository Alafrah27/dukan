import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";

export const CATEGORIES_QUERY_KEY = "categories";

/**
 * Fetch all categories for storefront
 */
export const useGetCategories = () => {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get("/category");
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
