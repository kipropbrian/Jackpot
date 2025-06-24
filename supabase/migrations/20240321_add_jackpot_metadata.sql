-- Add metadata column to jackpots table
ALTER TABLE public.jackpots 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the metadata structure
COMMENT ON COLUMN public.jackpots.metadata IS 'Stores additional jackpot information including:
- currency: The currency for amounts (e.g., "KSH")
- prizes: Object containing prize amounts for different tiers (13/13 through 17/17)
- bet_amounts: Object containing bet amounts for different tiers
Example:
{
    "currency": "KSH",
    "prizes": {
        "17/17": 419806932.30,
        "16/16": 113528958.94,
        "15/15": 84022450.44,
        "14/14": 67221056.65,
        "13/13": 13271980.38
    },
    "bet_amounts": {
        "17/17": 99.00,
        "16/16": 99.00,
        "15/15": 99.00,
        "14/14": 99.00,
        "13/13": 99.00
    }
}'; 