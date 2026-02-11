-- 1. Create Favorites Table (If not exists)
create table if not exists public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  product_id text not null, -- Matches string IDs in constants.tsx
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- 2. Enable RLS for Favorites
alter table public.favorites enable row level security;

-- 3. RLS Policies for Favorites (Drop first to avoid conflicts if re-running)
drop policy if exists "Users can view own favorites" on public.favorites;
create policy "Users can view own favorites" on public.favorites for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own favorites" on public.favorites;
create policy "Users can insert own favorites" on public.favorites for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites" on public.favorites for delete using (auth.uid() = user_id);

-- 4. Modify Order Items to support text Product IDs
-- CRITICAL FIX: Drop FK constraint first because uuid != text
alter table public.order_items drop constraint if exists order_items_product_id_fkey;

-- Now alter the column type
alter table public.order_items alter column product_id type text;

-- 5. Add payment_method to orders (if not exists)
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists shipping_details jsonb;

-- 6. Grant permissions (just in case)
grant all on public.favorites to authenticated;
grant all on public.favorites to service_role;
