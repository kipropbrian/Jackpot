import { useState, useEffect } from 'react';
import type { Jackpot } from '../api/types';
import { JackpotService } from '../api/services/jackpot-service';

export function useJackpot(id: string | undefined) {
  const [jackpot, setJackpot] = useState<Jackpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    JackpotService.getJackpot(id)
      .then(setJackpot)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { jackpot, loading, error };
}
