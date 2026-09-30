import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "@clerk/react";

const QUERY_KEY = "categories";

/**
 * Fetch all categories
 */
export const useGetCategories = () => {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const response = await api.get("/category");
      return response.data;
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Create a new category (admin only)
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ name, image }) => {
      const token = await getToken();
      const response = await api.post(
        "/category",
        { name, image },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * Update a category (admin only)
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ categoryId, name, image }) => {
      const token = await getToken();
      const response = await api.put(
        `/category/${categoryId}`,
        { name, image },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * Delete a category (admin only)
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (categoryId) => {
      const token = await getToken();
      const response = await api.delete(`/category/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
