-- ENABLE PUBLIC ACCESS FOR WISHLIST SHARING

-- 1. FAVORITES: Allow everyone to view everyone's favorites (for sharing)
-- We keep insert/delete restricted to own user, but select is now public.
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;

CREATE POLICY "Public can view all favorites" ON public.favorites
FOR SELECT USING (true);

-- 2. PROFILES: Allow everyone to view basic profile info (name, etc)
-- This is needed so when I share my list, you can see "Lista de [Mi Nombre]"
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Public can view all profiles" ON public.profiles
FOR SELECT USING (true);

-- 3. Verify changes
-- You should be able to run:
-- SELECT * FROM favorites; (as anon)
-- SELECT * FROM profiles; (as anon)
