-- 1. Create the 'products' bucket if it doesn't exist (just in case)
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- 2. Enable RLS on storage.objects (Standard Supabase security)
alter table storage.objects enable row level security;

-- 3. Policy: Allow PUBLIC (everyone) to SEE/DOWNLOAD images
-- This ensures your customers can actually see the product photos.
create policy "Public Access to Products Images"
on storage.objects for select
using ( bucket_id = 'products' );

-- 4. Policy: Allow AUTHENTICATED (LoggedIn Users) to UPLOAD
-- This allows you (since you are logged in) to send files.
create policy "Authenticated can upload images"
on storage.objects for insert
with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

-- 5. Policy: Allow AUTHENTICATED to DELETE/UPDATE (Optional but good)
create policy "Authenticated can delete images"
on storage.objects for delete
using ( bucket_id = 'products' and auth.role() = 'authenticated' );
