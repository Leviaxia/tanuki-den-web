-- HABILITAR RLS (Seguridad a nivel de fila)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 1. PERMITIR LECTURA A TODOS (Público)
-- Esto permite que cualquiera vea los productos en la tienda y en el admin
DROP POLICY IF EXISTS "Public Read 1" ON products;
CREATE POLICY "Public Read 1" ON products
FOR SELECT USING (true);

-- 2. PERMITIR TODO (Crear, Editar, Borrar) SOLO AL ADMIN
-- Reemplaza 'kaieke37@gmail.com' con tu correo si es diferente
DROP POLICY IF EXISTS "Admin Full Access" ON products;
CREATE POLICY "Admin Full Access" ON products
FOR ALL
USING (auth.jwt() ->> 'email' = 'kaieke37@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'kaieke37@gmail.com');

-- VERIFICAR
SELECT * FROM products LIMIT 5;
