/*
  # Add weight column to paver_sizes table

  1. Changes
    - Add `weight_per_stone` column to `paver_sizes` table (numeric, nullable)
    - This column stores the weight in kilograms per stone
    - Will be used to calculate total weight for orders

  2. Notes
    - Weight is optional and can be added for each stone type
    - Allows for weight-based calculations in the calculator
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paver_sizes' AND column_name = 'weight_per_stone'
  ) THEN
    ALTER TABLE paver_sizes ADD COLUMN weight_per_stone numeric;
  END IF;
END $$;