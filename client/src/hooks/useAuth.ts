import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
  adminName?: string;
  shopName?: string;
  whatsappBusinessNumber?: string;
  industry?: string;
  isOnboarded: boolean;
}

interface AuthResponse {
  user: User;
  message: string;
}

// Define OnboardingData interface for clarity, assuming it's used in mutations
interface OnboardingData {
  adminName: string;
  shopName: string;
  whatsappBusinessNumber: string;
  industry: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated, return null instead of throwing
        }
        throw new Error("Failed to fetch user");
      }
      return await response.json();
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Only check once on mount
    refetchInterval: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      return await response.json() as AuthResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.JSON.stringify(credentials),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }
      return await response.json() as AuthResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const onboardMutation = useMutation<AuthResponse, Error, OnboardingData>({
    mutationFn: async (data: OnboardingData) => {
      const response = await fetch("/api/auth/onboard", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Onboarding failed");
      }
      return await response.json() as AuthResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data);
    },
  });

  const updateProfileMutation = useMutation<AuthResponse, Error, OnboardingData>({
    mutationFn: async (data: OnboardingData) => {
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Profile update failed");
      }
      return await response.json() as AuthResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data);
    },
  });

  return {
    user: user?.user || null,
    isLoading,
    isAuthenticated: !!user?.user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    onboard: onboardMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isOnboarding: onboardMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
}