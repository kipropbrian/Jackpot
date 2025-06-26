import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  updateUserProfile,
} from "../supabase/auth-helpers";

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signInWithEmail(email, password),
    onSuccess: async () => {
      // Refetch auth queries to ensure auth state is updated before resolving
      await queryClient.refetchQueries({ queryKey: ["auth"] });
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      email,
      password,
      fullName,
    }: {
      email: string;
      password: string;
      fullName: string;
    }) => signUpWithEmail(email, password, { full_name: fullName }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["auth"] });
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      // Clear all cache on logout and refetch auth queries to update state
      queryClient.clear();
      // Also refetch auth queries to ensure state is properly cleared
      await queryClient.refetchQueries({ queryKey: ["auth"] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { full_name?: string }) => updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}
