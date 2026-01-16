-- 1. Create the 'products' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- 2. (OMITIDO) No intentamos cambiar RLS porque ya suele estar activo y da error de permisos.
-- alter table storage.objects enable row level security; <--- CAUSA ERROR 42501

-- 3. Limpiar políticas antiguas para evitar errores de "ya existe"
drop policy if exists "Public Access to Products Images" on storage.objects;
drop policy if exists "Authenticated can upload images" on storage.objects;
drop policy if exists "Authenticated can delete images" on storage.objects;

-- 4. Crear Política DE LECTURA (Pública)
create policy "Public Access to Products Images"
on storage.objects for select
using ( bucket_id = 'products' );

-- 5. Crear Política de SUBIDA (Solo Autenticados)
create policy "Authenticated can upload images"
on storage.objects for insert
with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

-- 6. Crear Política de BORRADO (Solo Autenticados)
create policy "Authenticated can delete images"
on storage.objects for delete
using ( bucket_id = 'products' and auth.role() = 'authenticated' );
