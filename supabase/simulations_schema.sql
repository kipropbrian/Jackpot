-- This schema file mirrors the production Supabase database.
-- Generated from supabase_scripts.txt to keep local migrations in sync.

-- Create profiles table that extends Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Enable RLS and policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can read their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function + trigger to create profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER IF NOT EXISTS on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- Simulations core tables
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.simulations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    jackpot_id UUID REFERENCES public.jackpots(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_combinations INTEGER NOT NULL,
    cost_per_bet DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    results JSONB
);

CREATE TABLE IF NOT EXISTS public.bet_combinations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE,
    combination_number INTEGER NOT NULL,
    predictions JSONB NOT NULL,
    is_winner BOOLEAN DEFAULT false,
    matches_count INTEGER DEFAULT 0,
    payout DECIMAL(15,2) DEFAULT 0,
    batch_number INTEGER
);

CREATE TABLE IF NOT EXISTS public.simulation_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE,
    total_winning_combinations INTEGER DEFAULT 0,
    total_payout DECIMAL(15,2) DEFAULT 0,
    net_loss DECIMAL(15,2),
    best_match_count INTEGER DEFAULT 0,
    winning_percentage DECIMAL(5,4) DEFAULT 0,
    analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(simulation_id)
);

-- RLS & policies for simulations tables
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can read their own simulations" ON public.simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own simulations" ON public.simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own simulations" ON public.simulations FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.bet_combinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can read their own bet combinations" ON public.bet_combinations FOR SELECT USING (EXISTS (SELECT 1 FROM public.simulations WHERE simulations.id = bet_combinations.simulation_id AND simulations.user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can insert bet combinations for their simulations" ON public.bet_combinations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.simulations WHERE simulations.id = bet_combinations.simulation_id AND simulations.user_id = auth.uid()));

ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can read their own simulation results" ON public.simulation_results FOR SELECT USING (EXISTS (SELECT 1 FROM public.simulations WHERE simulations.id = simulation_results.simulation_id AND simulations.user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can insert simulation results for their simulations" ON public.simulation_results FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.simulations WHERE simulations.id = simulation_results.simulation_id AND simulations.user_id = auth.uid()));

-- ---------------------------------------------------------------------
-- Jackpot & games tables (scraper)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jackpots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    jackpot_api_id TEXT UNIQUE,
    name TEXT NOT NULL,
    current_amount DECIMAL(15,2) NOT NULL,
    total_matches INTEGER NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'open',
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    jackpot_id UUID REFERENCES public.jackpots(id) ON DELETE CASCADE,
    game_api_id TEXT UNIQUE,
    kick_off_time TIMESTAMP WITH TIME ZONE,
    home_team TEXT,
    away_team TEXT,
    tournament TEXT,
    country TEXT,
    odds_home DECIMAL(10,2),
    odds_draw DECIMAL(10,2),
    odds_away DECIMAL(10,2),
    score_home INTEGER,
    score_away INTEGER,
    game_order INTEGER,
    betting_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Jackpot completion trigger
-- ---------------------------------------------------------------------
-- Function sets status="completed" and completed_at when all games have scores
CREATE OR REPLACE FUNCTION public.mark_jackpot_complete() RETURNS TRIGGER AS $$
DECLARE
  unfinished INTEGER;
BEGIN
  -- count remaining games without scores
  SELECT COUNT(1)
    INTO unfinished
    FROM public.games
   WHERE jackpot_id = NEW.jackpot_id
     AND (score_home IS NULL OR score_away IS NULL);
  IF unfinished = 0 THEN
    UPDATE public.jackpots
       SET status = 'completed',
           completed_at = NOW()
     WHERE id = NEW.jackpot_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger fires after each game update
CREATE TRIGGER trg_game_mark_complete
AFTER UPDATE OF score_home, score_away ON public.games
FOR EACH ROW
WHEN (OLD.score_home IS DISTINCT FROM NEW.score_home OR OLD.score_away IS DISTINCT FROM NEW.score_away)
EXECUTE FUNCTION public.mark_jackpot_complete();

-- RLS & policies for jackpots/games (service role unrestricted)
ALTER TABLE public.jackpots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Service role has full access to jackpots" ON public.jackpots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role has full access to games" ON public.games FOR ALL USING (true) WITH CHECK (true);
