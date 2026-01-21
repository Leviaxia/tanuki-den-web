-- Create Reviews Table
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  product_id text not null, -- Can be text ID from constants or UUID
  user_id text not null, -- Stores user ID (can be auth.uid() or guest ID)
  user_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Policies
-- Everyone can view reviews
create policy "Reviews are viewable by everyone" on public.reviews for select using (true);

-- Authenticated users (and guests if allowed by app logic) can insert
-- Since we manage user state in app (sometimes guest), we might want to allow public insert with validation or restrict to auth.
-- For now, let's allow public insert but we control it via App logic. 
-- Ideally strict RLS: 
-- create policy "Authenticated users can insert reviews" on public.reviews for insert with check (auth.role() = 'authenticated');
-- But keeping it simple for "guest/hybrid" app:
create policy "Everyone can insert reviews" on public.reviews for insert with check (true);
