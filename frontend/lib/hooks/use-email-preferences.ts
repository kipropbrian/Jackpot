import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export interface EmailPreferences {
  email_notifications: boolean;
}

export function useEmailPreferences(userId?: string) {
  return useQuery({
    queryKey: ["emailPreferences", userId],
    queryFn: async (): Promise<EmailPreferences> => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("email_notifications")
        .eq("id", userId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        email_notifications: data?.email_notifications ?? true,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateEmailPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      preferences,
    }: {
      userId: string;
      preferences: Partial<EmailPreferences>;
    }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(preferences)
        .eq("id", userId)
        .select("email_notifications")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch email preferences
      queryClient.invalidateQueries({
        queryKey: ["emailPreferences", variables.userId],
      });

      // Update the cache directly
      queryClient.setQueryData(["emailPreferences", variables.userId], data);
    },
  });
}
