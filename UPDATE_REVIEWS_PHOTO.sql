-- Add images column to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Create Storage Bucket for Reviews if it doesn't exist
-- Note: Creating buckets usually requires using the Dashboard or Storage API, but we can set policies.
-- Assuming bucket 'reviews' is created via Dashboard.

-- Storage Policies for 'reviews' bucket
-- Allow public read access
CREATE POLICY "Reviews images are viewable by everyone"
ON storage.objects FOR SELECT
USING ( bucket_id = 'reviews' );

-- Allow authenticated/public upload (depending on app auth state)
CREATE POLICY "Everyone can upload review images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'reviews' );
