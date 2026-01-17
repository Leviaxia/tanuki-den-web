-- Add columns for Cross-Device Syncing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS favorites jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cart jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS discount integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_spun boolean DEFAULT false;

-- Policy to allow users to update their own sync data (if not already covered)
-- This is usually covered by the generic "update own profile" policy, but good to verify.
