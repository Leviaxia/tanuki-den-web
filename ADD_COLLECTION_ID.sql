-- Add collection_id column to products table
ALTER TABLE public.products 
ADD COLUMN collection_id bigint REFERENCES public.collections(id) ON DELETE SET NULL;

-- Policy to allow public to read (already covered by "Products are viewable by everyone" usually, but good to check)
-- No extra policy needed if existing select policy covers new column.
