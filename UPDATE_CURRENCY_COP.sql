-- ACTUALIZACIÓN FINAL DE PRECIOS (Tasa: 3693 COP)

-- 1. Convertir precios de Dólares a Pesos
-- Multiplicamos el valor numérico actual por 3693
UPDATE products
SET price = price * 3693
WHERE price < 5000; -- Solo afecta a los que están en rango de dólares (ej: 100 USD)

-- 2. Limpieza de precios (Redondeo)
-- Para que no queden precios raros como "123,456.78"
-- Esto los dejará terminando en ceros (ej: 123.000)
UPDATE products
SET price = ROUND(price / 1000) * 1000
WHERE price > 0;

-- 3. Confirmación
SELECT name, price FROM products ORDER BY price DESC LIMIT 5;
