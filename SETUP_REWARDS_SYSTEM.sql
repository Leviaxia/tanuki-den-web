create table if not exists public.rewards (
    id text primary key,
    title text not null,
    description text,
    cost int not null check (cost >= 0),
    tier int not null check (tier between 1 and 4),
    type text not null check (type in ('digital', 'coupon', 'feature', 'physical')),
    value jsonb not null default '{}'::jsonb,
    stock int,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.user_rewards (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    reward_id text references public.rewards(id) on delete cascade not null,
    status text not null check (status in ('active', 'used', 'expired')) default 'active',
    redeemed_at timestamp with time zone default timezone('utc'::text, now()) not null,
    used_at timestamp with time zone,
    expires_at timestamp with time zone
);

alter table public.rewards enable row level security;
alter table public.user_rewards enable row level security;

drop policy if exists "Enable read access for all users" on public.rewards;
create policy "Enable read access for all users" on public.rewards for select using (true);

drop policy if exists "Enable read access for own rewards" on public.user_rewards;
create policy "Enable read access for own rewards" on public.user_rewards for select using (auth.uid() = user_id);

drop policy if exists "Enable insert access for own rewards" on public.user_rewards;
create policy "Enable insert access for own rewards" on public.user_rewards for insert with check (auth.uid() = user_id);

drop policy if exists "Enable update access for own rewards" on public.user_rewards;
create policy "Enable update access for own rewards" on public.user_rewards for update using (auth.uid() = user_id);

insert into public.rewards (id, title, description, cost, tier, type, value, stock) values
-- Tier 1: Engagement
('coupon_5k', 'Cupón $5.000 (Min $120k)', 'Descuento en compras superiores a $120.000cop.', 250, 1, 'coupon', '{"discount": 5000, "min_purchase": 120000, "code_prefix": "TNK5"}', null),
('coupon_15k', 'Cupón $15.000 (Min $180k)', 'Gran descuento para grandes tesoros.', 800, 2, 'coupon', '{"discount": 15000, "min_purchase": 180000, "code_prefix": "TNK15"}', null),
('shipping_free', 'Envío Gratis (Min $200k)', 'El Clan cubre tu envío completamente.', 1200, 3, 'coupon', '{"discount_type": "shipping_free", "min_purchase": 200000, "code_prefix": "FREESHIP"}', null),
('print_10off', '10% OFF Impresión 3D', 'Tope máximo de $25.000 de descuento.', 1500, 3, 'coupon', '{"discount_percent": 10, "max_discount": 25000, "category": "3d_print", "code_prefix": "3D10"}', null)
on conflict (id) do update set 
    title = excluded.title,
    description = excluded.description,
    cost = excluded.cost,
    value = excluded.value;

delete from public.rewards where id in ('early_access', 'figure_limited', 'bg_tanuki', 'frame_special');
