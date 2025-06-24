import { useQuery } from "@tanstack/react-query";
import type { Jackpot } from "../api/types";
import { JackpotService } from "../api/services/jackpot-service";

export function useJackpots() {
  const {
    data: jackpots = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["jackpots"],
    queryFn: JackpotService.getJackpots,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    jackpots,
    loading,
    error: error?.message || null,
    refetch,
  };
}
