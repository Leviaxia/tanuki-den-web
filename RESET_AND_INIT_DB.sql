-- 1. LIMPIEZA PROFUNDA (Borrar todo lo anterior para evitar conflictos)
-- Usamos 'CASCADE' para borrar también las relaciones y permisos viejos.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. TABLA DE PERFILES (Usuarios)
-- Vinculada estrictamente a auth.users de Supabase
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  username TEXT,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  birth_date DATE,
  membership TEXT, -- 'bronze', 'silver', 'gold', 'founder'
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA DE PRODUCTOS
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0, -- Numeric para dinero
  image TEXT,
  category TEXT DEFAULT 'General',
  stock INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  collection_id INTEGER, -- Para agrupar por colecciones si se desea
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA DE PEDIDOS (Orders)
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending', -- pending, paid, shipped, cancelled
    total NUMERIC NOT NULL,
    stripe_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA DE DETALLES DEL PEDIDO (Order Items)
CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity INTEGER DEFAULT 1,
    price_at_purchase NUMERIC NOT NULL
);

-- 6. HABILITAR SEGURIDAD (RLS - Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 7. DEFINIR POLÍTICAS DE SEGURIDAD (Permisos)

-- PERFILES:
-- Cada usuario puede ver y editar SOLAMENTE SU PROPIO perfil.
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- PRODUCTOS:
-- Todo el mundo (incluso no registrados) puede VER productos.
CREATE POLICY "Public products view" ON public.products 
  FOR SELECT USING (true);

-- Solo usuarios registrados ('authenticated') pueden CREAR/EDITAR productos (Para tu Admin Panel).
-- (En un futuro ideal, aquí filtrarías por un email específico o rol 'admin').
CREATE POLICY "Admin insert products" ON public.products 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
CREATE POLICY "Admin update products" ON public.products 
  FOR UPDATE USING (auth.role() = 'authenticated');
  
CREATE POLICY "Admin delete products" ON public.products 
  FOR DELETE USING (auth.role() = 'authenticated');

-- PEDIDOS:
-- Usuarios solo ven y crean sus propios pedidos.
CREATE POLICY "Users manage own orders" ON public.orders 
  FOR ALL USING (auth.uid() = user_id);

-- ITEMS DE PEDIDOS:
-- Usuarios ven items si el pedido les pertenece.
CREATE POLICY "Users view own order items" ON public.order_items 
  FOR SELECT USING (
    EXISTS ( SELECT 1 FROM public.orders WHERE public.orders.id = public.order_items.order_id AND public.orders.user_id = auth.uid() )
  );
  
CREATE POLICY "Users insert own order items" ON public.order_items 
  FOR INSERT WITH CHECK (
    EXISTS ( SELECT 1 FROM public.orders WHERE public.orders.id = public.order_items.order_id AND public.orders.user_id = auth.uid() )
  );


-- 8. TRIGGER DE REGISTRO AUTOMÁTICO (MEJORADO)
-- Esta función captura TODOS los datos enviados desde el registro (metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    location, 
    birth_date,
    avatar_url
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'location',
    (NULLIF(new.raw_user_meta_data->>'birth_date', ''))::date,
    'https://api.dicebear.com/7.x/micah/svg?seed=' || new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    birth_date = EXCLUDED.birth_date;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conectar la función al evento de creación de usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 9. CONFIGURACIÓN FINAL: STORAGE (Para imágenes)
-- Creamos el bucket 'avatars' si no existe.
-- Nota: Supabase SQL a veces no deja crear buckets directamente si no eres superadmin, 
-- si esto falla, crea el bucket 'avatars' manualmente en la sección Storage y hazlo público.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage (Cualquiera ve, Autenticados suben)
DROP POLICY IF EXISTS "Public Avatar View" ON storage.objects;
CREATE POLICY "Public Avatar View" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Auth Avatar Upload" ON storage.objects;
CREATE POLICY "Auth Avatar Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
