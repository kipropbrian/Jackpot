-- Migration: New Combination System Based on SportPesa Rules
-- This replaces the individual bet_combinations storage with specification-based storage
-- REMOVES ALL LEGACY FUNCTIONALITY

-- Drop the old bet_combinations table completely
DROP TABLE IF EXISTS public.bet_combinations CASCADE;

-- Create new bet_specifications table
CREATE TABLE IF NOT EXISTS public.bet_specifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE,
    game_selections JSONB NOT NULL, -- {"1": ["1"], "2": ["1","X"], "3": ["1","X","2"]}
    combination_type TEXT NOT NULL CHECK (combination_type IN ('single', 'double', 'triple', 'mixed')),
    double_games INTEGER[] DEFAULT '{}', -- Array of game positions with double selections [2, 5, 7]
    triple_games INTEGER[] DEFAULT '{}', -- Array of game positions with triple selections [3, 8]
    total_combinations INTEGER NOT NULL, -- Calculated: product of all game selection counts
    total_cost DECIMAL(15,2) NOT NULL, -- total_combinations * 99
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update simulations table to remove ALL legacy fields and add new ones
ALTER TABLE public.simulations 
    DROP COLUMN IF EXISTS total_combinations,
    DROP COLUMN IF EXISTS cost_per_bet,
    DROP COLUMN IF EXISTS progress,
    ADD COLUMN IF NOT EXISTS combination_type TEXT DEFAULT 'single',
    ADD COLUMN IF NOT EXISTS double_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS triple_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS effective_combinations INTEGER DEFAULT 0;

-- Update simulation_results to track prize levels instead of just total winners
ALTER TABLE public.simulation_results
    DROP COLUMN IF EXISTS total_winning_combinations,
    DROP COLUMN IF EXISTS total_payout,
    DROP COLUMN IF EXISTS winning_percentage,
    ADD COLUMN IF NOT EXISTS prize_level_wins JSONB DEFAULT '{}', -- {"13": 5, "14": 2, "15": 1, "16": 0, "17": 0}
    ADD COLUMN IF NOT EXISTS prize_level_payouts JSONB DEFAULT '{}', -- {"13": 67773749.2, "14": 135033746.44, ...}
    ADD COLUMN IF NOT EXISTS total_payout DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_winners INTEGER DEFAULT 0;

-- Add constraints for SportPesa rules
ALTER TABLE public.bet_specifications 
    ADD CONSTRAINT check_sportpesa_double_limit 
    CHECK (array_length(double_games, 1) IS NULL OR array_length(double_games, 1) <= 10),
    ADD CONSTRAINT check_sportpesa_triple_limit 
    CHECK (array_length(triple_games, 1) IS NULL OR array_length(triple_games, 1) <= 5),
    ADD CONSTRAINT check_sportpesa_mixed_limit 
    CHECK (
        (array_length(double_games, 1) IS NULL OR array_length(double_games, 1) <= 9) OR
        (array_length(triple_games, 1) IS NULL OR array_length(triple_games, 1) <= 5)
    );

-- RLS policies for bet_specifications
ALTER TABLE public.bet_specifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own bet specifications" 
    ON public.bet_specifications FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.simulations 
        WHERE simulations.id = bet_specifications.simulation_id 
        AND simulations.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert bet specifications for their simulations" 
    ON public.bet_specifications FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.simulations 
        WHERE simulations.id = bet_specifications.simulation_id 
        AND simulations.user_id = auth.uid()
    ));

-- Function to calculate combination count
CREATE OR REPLACE FUNCTION calculate_combination_count(game_selections JSONB)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER := 1;
    game_key TEXT;
    selections JSONB;
BEGIN
    FOR game_key, selections IN SELECT * FROM jsonb_each(game_selections) LOOP
        total := total * jsonb_array_length(selections);
    END LOOP;
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to validate SportPesa rules
CREATE OR REPLACE FUNCTION validate_sportpesa_rules(
    double_games INTEGER[],
    triple_games INTEGER[]
) RETURNS BOOLEAN AS $$
BEGIN
    -- Rule 1: Max 10 doubles only
    IF array_length(triple_games, 1) IS NULL AND array_length(double_games, 1) > 10 THEN
        RETURN FALSE;
    END IF;
    
    -- Rule 2: Max 5 triples only  
    IF array_length(double_games, 1) IS NULL AND array_length(triple_games, 1) > 5 THEN
        RETURN FALSE;
    END IF;
    
    -- Rule 3: Mixed combinations limits
    IF array_length(double_games, 1) IS NOT NULL AND array_length(triple_games, 1) IS NOT NULL THEN
        IF array_length(double_games, 1) > 9 OR array_length(triple_games, 1) > 5 THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to extract prize levels from jackpot metadata
CREATE OR REPLACE FUNCTION get_jackpot_prize_levels(jackpot_metadata JSONB)
RETURNS TEXT[] AS $$
DECLARE
    prize_levels TEXT[];
    prize_key TEXT;
BEGIN
    prize_levels := ARRAY[]::TEXT[];
    
    IF jackpot_metadata ? 'prizes' THEN
        FOR prize_key IN SELECT jsonb_object_keys(jackpot_metadata->'prizes') LOOP
            prize_levels := array_append(prize_levels, split_part(prize_key, '/', 1));
        END LOOP;
    END IF;
    
    RETURN prize_levels;
END;
$$ LANGUAGE plpgsql; 