-- Add unique constraint to simulation_id in simulation_results table
ALTER TABLE public.simulation_results ADD CONSTRAINT simulation_results_simulation_id_key UNIQUE (simulation_id); 