-- First, verify there are no existing NULL values
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM public.jackpots WHERE jackpot_api_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot add NOT NULL constraint - there are existing rows with NULL jackpot_api_id';
    END IF;
END $$;

-- Add NOT NULL constraint to jackpot_api_id
ALTER TABLE public.jackpots 
    ALTER COLUMN jackpot_api_id SET NOT NULL;

-- Add a comment explaining the constraint
COMMENT ON COLUMN public.jackpots.jackpot_api_id IS 'The unique identifier from the SportPesa API. Must not be NULL as it is used to prevent duplicate jackpots.'; 