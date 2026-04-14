-- COMPLETE FIX FOR PROFILES TABLE
-- This script ensures all necessary columns exist for the new profile editing and shipping features.

-- 1. Add shipping columns if missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_department TEXT;

-- 2. Ensure username and full_name exist (they should, but we double check)
-- Note: 'username' is used as the 'Display Name' in the app
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='username') THEN
        ALTER TABLE public.profiles ADD COLUMN username TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- 3. Verify RLS policies (Ensure users can still update their own profile)
-- These should already exist from the schema, but we re-assert them just in case.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

COMMENT ON TABLE public.profiles IS 'Stores user profile information including shipping details.';
