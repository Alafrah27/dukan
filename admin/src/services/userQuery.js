import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "@clerk/react";

/**
 * Sync or create current authenticated user with MongoDB
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const {
    mutateAsync: createUser,
    isPending: isLoading,
    error: isError,
  } = useMutation({
    mutationFn: async () => {
      try {
        const token = await getToken();
        const response = await api.post(
          "/user",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
      }
    },
    retry: (failureCount, error) => {
      if (
        error.message.includes("Network Error") ||
        error.message.includes("500") ||
        error.message.includes("502") ||
        error.message.includes("503") ||
        error.message.includes("504")
      ) {
        return failureCount < 3;
      }
      return false;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Clerk user sync mutation failed:", error.message);
    },
  });

  return { createUser, isLoading, isError };
};

/**
 * Fetch all users with search, role filter, and pagination
 */
export const useGetUsers = ({
  page = 1,
  limit = 10,
  search = "",
  role = "",
} = {}) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["users", { page, limit, search, role }],
    queryFn: async () => {
      try {
        const token = await getToken();
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (search && search.trim()) {
          queryParams.append("search", search.trim());
        }
        if (role && role !== "all") {
          queryParams.append("role", role);
        }

        const response = await api.get(`/user?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data;
      } catch (error) {
        throw new Error(
          error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "حدث خطأ أثناء جلب قائمة المستخدمين",
        );
      }
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Update user role (e.g. user -> admin or admin -> user)
 */
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, role }) => {
      try {
        const token = await getToken();
        const response = await api.patch(
          `/user/${id}/role`,
          { role },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        return response.data;
      } catch (error) {
        throw new Error(
          error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "فشل تحديث صلاحية المستخدم",
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

/**
 * Delete a user by ID
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id) => {
      try {
        const token = await getToken();
        const response = await api.delete(`/user/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data;
      } catch (error) {
        throw new Error(
          error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "فشل حذف المستخدم",
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

/**
 * Get current authenticated user profile
 */
export const useGetCurrentUser = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get("/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data?.user;
    },
  });
};
