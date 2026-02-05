-- 1. Ensure 'reviews' table has the images column
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- 2. ENABLE Row Level Security (RLS) if not already on
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. KEY FIX: Allow EVERYONE to READ reviews (Public Read)
-- We drop first to ensure we can recreate it without errors
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reviews;
CREATE POLICY "Enable read access for all users" ON public.reviews FOR SELECT USING (true);

-- 4. Allow Authenticated users to INSERT reviews (if login required) 
-- OR Public Insert if you allow guest reviews
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.reviews;
CREATE POLICY "Enable insert for authenticated users only" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. STORAGE: Fix 'reviews' bucket
insert into storage.buckets (id, name, public)
values ('reviews', 'reviews', true)
on conflict (id) do nothing;

-- 6. STORAGE POLICIES (Idempotent)
DROP POLICY IF EXISTS "Reviews images are viewable by everyone" ON storage.objects;
CREATE POLICY "Reviews images are viewable by everyone"
ON storage.objects FOR SELECT
USING ( bucket_id = 'reviews' );

DROP POLICY IF EXISTS "Everyone can upload review images" ON storage.objects;
CREATE POLICY "Everyone can upload review images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'reviews' );
