-- NUCLEAR OPTION V2: Switch to TEXT column (JSON String) to bypass Array issues
ALTER TABLE public.reviews DROP COLUMN IF EXISTS images;
ALTER TABLE public.reviews ADD COLUMN images text DEFAULT '[]';

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RECREATE POLICIES (Force Allow)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reviews;
CREATE POLICY "Enable read access for all users" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.reviews;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.reviews;
CREATE POLICY "Enable insert for everyone" ON public.reviews FOR INSERT WITH CHECK (true);

-- STORAGE FIXES
insert into storage.buckets (id, name, public) values ('reviews', 'reviews', true) on conflict (id) do nothing;

-- PERMISSIONS STORAGE
DROP POLICY IF EXISTS "Reviews images are viewable by everyone" ON storage.objects;
CREATE POLICY "Reviews images are viewable by everyone" ON storage.objects FOR SELECT USING ( bucket_id = 'reviews' );

DROP POLICY IF EXISTS "Everyone can upload review images" ON storage.objects;
CREATE POLICY "Everyone can upload review images" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'reviews' );
