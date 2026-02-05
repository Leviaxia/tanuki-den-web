-- 1. Add images column to reviews table (if not exists)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- 2. Create 'reviews' bucket (if not exists) via SQL
insert into storage.buckets (id, name, public)
values ('reviews', 'reviews', true)
on conflict (id) do nothing;

-- 3. Storage Policies for 'reviews' bucket
-- We DROP first to avoid "policy already exists" errors if re-running.

DROP POLICY IF EXISTS "Reviews images are viewable by everyone" ON storage.objects;
CREATE POLICY "Reviews images are viewable by everyone"
ON storage.objects FOR SELECT
USING ( bucket_id = 'reviews' );

DROP POLICY IF EXISTS "Everyone can upload review images" ON storage.objects;
CREATE POLICY "Everyone can upload review images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'reviews' );

DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'reviews' );
