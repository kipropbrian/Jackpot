-- Simulations table to store user simulation data
CREATE TABLE public.simulations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_combinations INTEGER NOT NULL,
    cost_per_bet DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, running, completed, failed
    progress INTEGER DEFAULT 0, -- 0-100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    results JSONB -- Final results summary
);

-- Generated bet combinations
CREATE TABLE public.bet_combinations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE,
    combination_number INTEGER NOT NULL,
    predictions JSONB NOT NULL, -- Array of predictions [1,X,2,1,X,...]
    is_winner BOOLEAN DEFAULT false,
    matches_count INTEGER DEFAULT 0, -- How many games matched
    payout DECIMAL(15,2) DEFAULT 0,
    batch_number INTEGER -- For processing in batches
);

-- Simulation results summary
CREATE TABLE public.simulation_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE,
    total_winning_combinations INTEGER DEFAULT 0,
    total_payout DECIMAL(15,2) DEFAULT 0,
    net_loss DECIMAL(15,2),
    best_match_count INTEGER DEFAULT 0,
    winning_percentage DECIMAL(5,4) DEFAULT 0,
    analysis JSONB, -- Detailed breakdown
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on simulations table
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own simulations
CREATE POLICY "Users can read their own simulations" 
ON public.simulations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own simulations
CREATE POLICY "Users can insert their own simulations" 
ON public.simulations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own simulations
CREATE POLICY "Users can update their own simulations" 
ON public.simulations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable Row Level Security on bet_combinations table
ALTER TABLE public.bet_combinations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own bet combinations
CREATE POLICY "Users can read their own bet combinations" 
ON public.bet_combinations 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.simulations 
        WHERE simulations.id = bet_combinations.simulation_id 
        AND simulations.user_id = auth.uid()
    )
);

-- Create policy to allow users to insert bet combinations for their simulations
CREATE POLICY "Users can insert bet combinations for their simulations" 
ON public.bet_combinations 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.simulations 
        WHERE simulations.id = bet_combinations.simulation_id 
        AND simulations.user_id = auth.uid()
    )
);

-- Enable Row Level Security on simulation_results table
ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own simulation results
CREATE POLICY "Users can read their own simulation results" 
ON public.simulation_results 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.simulations 
        WHERE simulations.id = simulation_results.simulation_id 
        AND simulations.user_id = auth.uid()
    )
);

-- Create policy to allow users to insert simulation results for their simulations
CREATE POLICY "Users can insert simulation results for their simulations" 
ON public.simulation_results 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.simulations 
        WHERE simulations.id = simulation_results.simulation_id 
        AND simulations.user_id = auth.uid()
    )
);
