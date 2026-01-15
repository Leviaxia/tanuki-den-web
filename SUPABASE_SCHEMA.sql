create table public.profiles (
  id uuid references auth.users not null,
  email text,
  username text,
  full_name text,
  phone text,
  location text,
  birth_date date,
  membership text,
  avatar_url text,
  primary key (id)
);

-- Create Products table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price integer not null, -- stored in cents
  image_url text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Orders table
create table public.orders (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id),
    status text default 'pending', -- pending, paid, shipped, cancelled
    total integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    stripe_session_id text
);

-- Create Order Items table
create table public.order_items (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders(id),
    product_id uuid references public.products(id),
    quantity integer default 1,
    price_at_purchase integer not null -- store price at time of purchase
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policies
-- Profiles: Users can read/update their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Products: Everyone can read, only admins/service_role can update (simplified for now as 'authenticated' can update if we want admin user, or just manual db entry)
create policy "Products are viewable by everyone" on public.products for select using (true);
create policy "Authenticated users can insert products" on public.products for insert with check (auth.role() = 'authenticated'); -- Temporary for 'Easy Edit' feature
create policy "Authenticated users can update products" on public.products for update using (auth.role() = 'authenticated'); -- Temporary for 'Easy Edit' feature

-- Orders: Users can view their own orders
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);

-- Order Items: Users can view their own order items
create policy "Users can view own order items" on public.order_items for select using (
    exists ( select 1 from public.orders where public.orders.id = public.order_items.order_id and public.orders.user_id = auth.uid() )
);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
