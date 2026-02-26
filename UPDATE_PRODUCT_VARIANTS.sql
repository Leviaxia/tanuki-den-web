-- Script to add 'variants' column to the 'products' table.
-- Products will store an array of variant objects: { id: string, name: string, image: string }
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
