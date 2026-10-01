import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";

export const USER_QUERY_KEY = "user";

/**
 * Hook to sync/create authenticated Clerk user in MongoDB
 */
export const useSyncUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post("/user", {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([USER_QUERY_KEY, "me"], data);
    },
  });
};

/**
 * Hook to get current logged in user profile
 */
export const useGetCurrentUser = (options = {}) => {
  return useQuery({
    queryKey: [USER_QUERY_KEY, "me"],
    queryFn: async () => {
      const response = await api.get("/user/me");
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/**
 * Hook to update Expo push notification token
 */
export const useUpdatePushToken = () => {
  return useMutation({
    mutationFn: async (expoPushToken) => {
      const response = await api.put("/user/update-expo-push-token", {
        expoPushToken,
      });
      return response.data;
    },
  });
};

/**
 * Hook to delete authenticated user account
 */
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete("/user/me");
      return response.data;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

