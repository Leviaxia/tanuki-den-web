-- ==============================================================================
-- FINAL_DB_SETUP.sql
-- Script DEFINITIVO para Tanuki Den Web Edition
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Ve al SQL Editor en Supabase.
-- 2. Copia y pega TODO este contenido.
-- 3. Dale al botón "Run".
-- 4. Si hay algun error rojo, suele ser porque tarda en borrar, dale "Run" de nuevo.
-- ==============================================================================

-- [1] LIMPIEZA TOTAL (Empezar de Cero)
-- Borra funciones y tablas antiguas para evitar conflictos.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- [2] CREACIÓN DE TABLAS

-- A. Perfiles de Usuario (Se llena automáticamente al registrarse)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  username TEXT,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  birth_date DATE,
  membership TEXT DEFAULT NULL, -- 'bronze', 'silver', 'gold', 'founder'
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- B. Productos (Catálogo)
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  image TEXT,
  category TEXT DEFAULT 'General',
  stock INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  collection_id INTEGER, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. Pedidos (Orders)
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending', -- pending, paid, shipped, cancelled
    total NUMERIC NOT NULL,
    stripe_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. Items del Pedido
CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity INTEGER DEFAULT 1,
    price_at_purchase NUMERIC NOT NULL
);

-- [3] SEGURIDAD (Row Level Security)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas Profiles
-- "Yo puedo ver y editar MI propio perfil"
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Permiso CRÌTICO que faltaba antes: Insertar su propio perfil (por si el trigger falla, aunque usaremos trigger)
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas Products
-- "Todos ven productos, solo admin (autenticado por ahora) edita"
CREATE POLICY "Public products view" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin manage products" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- Políticas Orders
-- "Yo veo y gestiono MIS pedidos"
CREATE POLICY "Users manage own orders" ON public.orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own order items" ON public.order_items FOR ALL USING (
    EXISTS ( SELECT 1 FROM public.orders WHERE public.orders.id = public.order_items.order_id AND public.orders.user_id = auth.uid() )
);

-- [4] AUTOMATIZACIÓN (Trigger de Registro)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar perfil: Mapeamos 'username' (apodo) y 'full_name'
  INSERT INTO public.profiles (
    id, 
    email, 
    username, -- Nuevo: Mapeo explícito
    full_name, 
    phone, 
    location, 
    birth_date,
    avatar_url
  )
  VALUES (
    new.id, 
    new.email, 
    -- Username: Viene del metadato 'username' o 'full_name'
    COALESCE(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    -- Full Name: Igual, usamos lo que haya
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'location',
    (NULLIF(new.raw_user_meta_data->>'birth_date', ''))::date,
    'https://api.dicebear.com/7.x/micah/svg?seed=' || new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    birth_date = EXCLUDED.birth_date;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- [5] STORAGE (Imágenes de Avatar)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Avatar View" ON storage.objects;
CREATE POLICY "Public Avatar View" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Auth Avatar Upload" ON storage.objects;
CREATE POLICY "Auth Avatar Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Fin del setup
