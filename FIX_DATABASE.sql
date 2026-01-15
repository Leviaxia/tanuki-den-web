-- ==============================================================================
-- SCHEMA COMPLETO DE TANUKI DEN (CORREGIDO)
-- Copia y pega TODO esto en el SQL Editor de Supabase para arreglar la base de datos.
-- ==============================================================================

-- 1. Limpieza Preventiva (Esto borra tablas antiguas para evitar conflictos, CUIDADO si ya tienes datos reales)
-- drop table if exists public.order_items;
-- drop table if exists public.orders;
-- drop table if exists public.products;
-- drop table if exists public.profiles;

-- 2. Tabla de PERFILES (Usuarios)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  username text,
  full_name text,
  phone text,
  location text,
  birth_date date,
  membership text,
  avatar_url text
);

-- 3. Tabla de PRODUCTOS
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null, -- Cambiado a numeric para decimales exactos
  image text,
  category text,
  stock integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabla de PEDIDOS (Orders)
create table if not exists public.orders (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id),
    status text default 'pending', -- pending, paid, shipped, cancelled
    total numeric not null,
    stripe_session_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabla de ITEMS DEL PEDIDO
create table if not exists public.order_items (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders(id),
    product_id uuid references public.products(id),
    quantity integer default 1,
    price_at_purchase numeric not null
);

-- 6. SEGURIDAD (Row Level Security)
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Borrar políticas viejas para no duplicar error
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Products are viewable by everyone" on public.products;
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Users can view own orders" on public.orders;
drop policy if exists "Users can insert own orders" on public.orders;
drop policy if exists "Users can view own order items" on public.order_items;

-- Políticas Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Políticas Products (Público ver, Admin editar)
create policy "Products are viewable by everyone" on public.products for select using (true);
-- ¡OJO! Aquí permitimos insertar a cualquier usuario AUTENTICADO para que tú puedas editar desde /admin
-- En el futuro deberíamos restringir esto a un rol de admin específico
create policy "Authenticated users can insert products" on public.products for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update products" on public.products for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete products" on public.products for delete using (auth.role() = 'authenticated');

-- Políticas Orders
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);

-- Políticas Order Items
create policy "Users can view own order items" on public.order_items for select using (
    exists ( select 1 from public.orders where public.orders.id = public.order_items.order_id and public.orders.user_id = auth.uid() )
);

-- 7. TRIGGER AUTOMÁTICO (Opcional pero recomendado)
-- Crea el perfil automáticamente cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'https://api.dicebear.com/7.x/micah/svg?seed=' || new.email
  )
  on conflict (id) do nothing; -- Evita error si ya existe
  return new;
end;
$$ language plpgsql security definer;

-- Re-crear Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. STORAGE (Para imágenes)
-- Esto usualmente se hace en la UI, pero el bucket 'avatars' debe ser público.
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
-- Políticas storage
create policy "Avatar images are publicly accessible" on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Anyone can upload an avatar" on storage.objects for insert with check ( bucket_id = 'avatars' );
