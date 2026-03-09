/*
  # Create paver sizes table
  
  1. New Tables
    - `paver_sizes`
      - `id` (uuid, primary key)
      - `name` (text) - Display name like "Waal", "BKK", "30x30"
      - `length` (numeric) - Length in cm
      - `width` (numeric) - Width in cm
      - `is_standard` (boolean) - Whether it's a standard size or custom
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `paver_sizes` table
    - Everyone can read standard sizes
    - Only authenticated users can create custom sizes
  
  3. Initial Data
    - Populate with common paver and tile sizes
*/

CREATE TABLE IF NOT EXISTS paver_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  length numeric NOT NULL,
  width numeric NOT NULL,
  is_standard boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE paver_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read paver sizes"
  ON paver_sizes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert custom sizes"
  ON paver_sizes
  FOR INSERT
  TO authenticated
  WITH CHECK (is_standard = false);

-- Insert common paver and tile sizes
INSERT INTO paver_sizes (name, length, width, is_standard) VALUES
  ('Waal (20.5x10)', 20.5, 10, true),
  ('Waal (21x10.5)', 21, 10.5, true),
  ('BKK (21x7)', 21, 7, true),
  ('Klinker (20x10)', 20, 10, true),
  ('Dikformaat (20x30)', 20, 30, true),
  ('Tegel 30x30', 30, 30, true),
  ('Tegel 40x40', 40, 40, true),
  ('Tegel 50x50', 50, 50, true),
  ('Tegel 60x60', 60, 60, true),
  ('Tegel 80x80', 80, 80, true),
  ('Tegel 100x100', 100, 100, true),
  ('Tegel 30x60', 30, 60, true),
  ('Tegel 40x80', 40, 80, true),
  ('Tegel 60x120', 60, 120, true),
  ('Keiformaat (15x15x15)', 15, 15, true),
  ('Megategels 120x120', 120, 120, true)
ON CONFLICT DO NOTHING;