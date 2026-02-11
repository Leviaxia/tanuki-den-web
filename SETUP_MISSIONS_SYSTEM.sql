-- 1. Create User Missions Table
create table if not exists public.user_missions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mission_id text not null,
  progress int default 0,
  completed boolean default false,
  claimed boolean default false,
  updated_at timestamptz default now(),
  unique(user_id, mission_id)
);

-- 2. Enable RLS
alter table public.user_missions enable row level security;

-- 3. Policies (Idempotent: Drop first to avoid conflicts)
drop policy if exists "Users can view own missions" on public.user_missions;
create policy "Users can view own missions" 
on public.user_missions for select 
using (auth.uid() = user_id);

drop policy if exists "Users can update own missions" on public.user_missions;
create policy "Users can update own missions" 
on public.user_missions for insert 
with check (auth.uid() = user_id);

drop policy if exists "Users can update own missions 2" on public.user_missions;
create policy "Users can update own missions 2" 
on public.user_missions for update
using (auth.uid() = user_id);

-- 4. Increment Coins Function (Safe RPC)
create or replace function increment_coins(x int, user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set coins = coalesce(coins, 0) + x
  where id = user_id;
end;
$$;
