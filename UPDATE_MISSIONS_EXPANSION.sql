/*
  1. Add Tracking Columns to Profiles
*/
alter table public.profiles 
add column if not exists total_spent int default 0,
add column if not exists total_orders int default 0,
add column if not exists total_3d_orders int default 0,
add column if not exists login_days_consecutive int default 1,
add column if not exists login_days_total int default 1,
add column if not exists last_login_date date default CURRENT_DATE,
add column if not exists products_viewed_count int default 0,
add column if not exists products_favorited_count int default 0,
add column if not exists products_shared_count int default 0;

/*
  2. Insert Exclusive Reward
*/
insert into public.rewards (id, title, description, cost, tier, type, value, stock) values
('forest_spirit_figure', 'Figura Espíritu del Bosque (30cm)', 'Edición Limitada. Solo para Leyendas del Clan.', 5000, 4, 'physical', '{"item": "forest_spirit_v1", "requires_mission": "legend_clan"}', 10)
on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    cost = excluded.cost,
    value = excluded.value;
