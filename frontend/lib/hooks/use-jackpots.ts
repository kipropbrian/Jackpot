import { useQuery } from "@tanstack/react-query";
import { JackpotService } from "../api/services/jackpot-service";
import { Jackpot } from "../api/types";

export function useJackpots() {
  const {
    data: jackpots = [] as Jackpot[],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["jackpots"],
    queryFn: JackpotService.getJackpots,
    staleTime: 30 * 60 * 1000, // 30 minutes since jackpot data changes infrequently
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour (formerly cacheTime)
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: true, // But do refetch when user returns to tab
    refetchOnReconnect: true, // And when they regain internet
    refetchInterval: 5 * 60 * 1000, // Refresh in background every 5 minutes
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  return {
    jackpots,
    loading,
    error: error?.message || null,
    refetch,
  };
}

export function useLatestJackpot() {
  const {
    data: jackpot,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["latest-jackpot"],
    queryFn: JackpotService.getLatestJackpot,
    staleTime: 30 * 60 * 1000, // 30 minutes since jackpot data changes infrequently
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    jackpot,
    loading,
    error: error?.message || null,
    refetch,
  };
}
