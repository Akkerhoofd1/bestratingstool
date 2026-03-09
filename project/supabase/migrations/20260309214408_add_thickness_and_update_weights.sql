/*
  # Add thickness and update weights for paver sizes

  1. Changes
    - Add `thickness` column to `paver_sizes` table (numeric, nullable)
    - Update weight_per_stone for standard Dutch paver sizes:
      - Waalformaat 20x5: 1.35 kg (6cm), 1.80 kg (8cm)
      - Dikformaat 21x7: 2.00 kg (6cm), 2.70 kg (8cm)
      - Keiformaat/BKK 21x10.5: 3.10 kg (6cm), 4.15 kg (8cm), 5.20 kg (10cm)
      - Stoeptegel 30x30: 9.20 kg (4.5cm), 12.30 kg (6cm), 16.50 kg (8cm)

  2. Notes
    - Thickness is stored in centimeters
    - Weights are based on standard Dutch construction data
    - Default to 6cm thickness for most pavers
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paver_sizes' AND column_name = 'thickness'
  ) THEN
    ALTER TABLE paver_sizes ADD COLUMN thickness numeric;
  END IF;
END $$;

UPDATE paver_sizes 
SET thickness = 6, weight_per_stone = 1.35
WHERE name = 'Waalformaat (20x5)';

UPDATE paver_sizes 
SET thickness = 6, weight_per_stone = 2.00
WHERE name = 'Dikformaat (21x7)';

UPDATE paver_sizes 
SET thickness = 6, weight_per_stone = 3.10
WHERE name = 'Keiformaat / BKK (21x10.5)';

UPDATE paver_sizes 
SET thickness = 6, weight_per_stone = 12.30
WHERE name = 'Tegel 30x30';