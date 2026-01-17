-- 1. Create Collections Table
CREATE TABLE public.collections (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT,
    rotation TEXT DEFAULT '0deg',
    accent TEXT DEFAULT '#3A332F',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy for Public Read Access
CREATE POLICY "Public Read Access" 
ON public.collections FOR SELECT 
USING (true);

-- 4. Create Policy for Admin Full Access
-- (Simplifying to allow all operations for now, similar to products table in dev mode)
CREATE POLICY "Admin Full Access" 
ON public.collections FOR ALL 
USING (true);

-- 5. Seed Data from Constants
INSERT INTO public.collections (id, title, image, description, rotation, accent) VALUES
(1, 'Brisa de Ghibli', 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=800&auto=format&fit=crop', 'Piezas que evocan la nostalgia y la magia de los mundos de Studio Ghibli.', '-3deg', '#81C784'),
(2, 'Guerreros Cyber', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop', 'La tecnología y el espíritu samurái se fusionan en estas figuras futuristas.', '2deg', '#C14B3A'),
(3, 'Misterios de Teyvat', 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=800&auto=format&fit=crop', 'Viaja por las naciones de Genshin Impact con nuestros héroes favoritos.', '-1deg', '#D4AF37'),
(4, 'Sombras de Kyoto', 'https://images.unsplash.com/photo-1528164344705-47542687990d?q=80&w=800&auto=format&fit=crop', 'Estética tradicional japonesa reimaginada para tu colección personal.', '4deg', '#3A332F'),
(5, 'Reliquias Retro', 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?q=80&w=800&auto=format&fit=crop', 'Tesoros de los 80s y 90s que marcaron nuestra infancia.', '-2deg', '#5D4037'),
(6, 'Bosque Sagrado', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop', 'Criaturas místicas y guardianes de la naturaleza en resina y PVC.', '1deg', '#4A6741');

-- 6. Reset Sequence (Important to avoid ID conflicts for new items)
SELECT setval('collections_id_seq', (SELECT MAX(id) FROM public.collections));
