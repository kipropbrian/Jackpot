import { useQuery } from "@tanstack/react-query";
import { JackpotService } from "../api/services/jackpot-service";

export function useJackpot(id: string | undefined) {
  const {
    data: jackpot,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["jackpot", id],
    queryFn: () => JackpotService.getJackpot(id!),
    enabled: !!id, // Only run query if id exists
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    jackpot: jackpot || null,
    loading,
    error: error?.message || null,
    refetch,
  };
}
