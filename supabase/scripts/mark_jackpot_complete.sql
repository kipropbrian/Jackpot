-- mark_jackpot_complete.sql
-- -----------------------------------------------------------------------------
-- Adds status/completed_at to jackpots and creates a trigger that automatically
-- marks a jackpot as completed when all its games have recorded scores.
--
-- Safe to run multiple times (IF NOT EXISTS / CREATE OR REPLACE).
-- -----------------------------------------------------------------------------

-- 1. Add status & completed_at columns if they don't exist
ALTER TABLE public.jackpots
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

ALTER TABLE public.jackpots
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 2. Create / replace the trigger function
CREATE OR REPLACE FUNCTION public.mark_jackpot_complete() RETURNS TRIGGER AS $$
DECLARE
    unfinished INTEGER;
BEGIN
    -- Count games without both scores recorded
    SELECT COUNT(1)
      INTO unfinished
      FROM public.games
     WHERE jackpot_id = NEW.jackpot_id
       AND (score_home IS NULL OR score_away IS NULL);

    IF unfinished = 0 THEN
        UPDATE public.jackpots
           SET status       = 'completed',
               completed_at = NOW()
         WHERE id = NEW.jackpot_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger to games table (one‐time creation)
DO $$
BEGIN
    -- Drop existing to ensure latest definition (optional)
    IF EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_game_mark_complete'
    ) THEN
        DROP TRIGGER trg_game_mark_complete ON public.games;
    END IF;

    CREATE TRIGGER trg_game_mark_complete
    AFTER UPDATE OF score_home, score_away ON public.games
    FOR EACH ROW
    WHEN (OLD.score_home IS DISTINCT FROM NEW.score_home OR OLD.score_away IS DISTINCT FROM NEW.score_away)
    EXECUTE FUNCTION public.mark_jackpot_complete();
END$$;
