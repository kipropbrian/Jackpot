import { useEffect, useState } from 'react';
import type { Jackpot } from '../api/types';
import { JackpotService } from '../api/services/jackpot-service';

export function useJackpots() {
  const [jackpots, setJackpots] = useState<Jackpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    JackpotService.getJackpots()
      .then(setJackpots)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { jackpots, loading, error };
}
