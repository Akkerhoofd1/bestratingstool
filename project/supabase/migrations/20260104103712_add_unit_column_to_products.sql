/*
  # Add unit column to products table

  1. Changes
    - Add `unit` column to `products` table with default value 'stuk'
    - Column stores the unit of measurement (e.g., m2, m3, stuk, uur)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'unit'
  ) THEN
    ALTER TABLE products ADD COLUMN unit text DEFAULT 'stuk' NOT NULL;
  END IF;
END $$;