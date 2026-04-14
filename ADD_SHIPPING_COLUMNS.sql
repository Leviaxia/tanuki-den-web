-- Add shipping information columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_department TEXT;

-- Update RLS policies (optional, usually profiles update covers this, but good to ensure)
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; -- Already enabled in schema
