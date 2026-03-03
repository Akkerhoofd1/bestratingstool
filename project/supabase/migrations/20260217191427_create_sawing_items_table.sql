/*
  # Create sawing items table

  1. New Tables
    - `sawing_items`
      - `id` (uuid, primary key)
      - `registration_id` (uuid, foreign key to hours_registration)
      - `material` (text) - type of material being sawn
      - `meters` (numeric) - meters of sawing
      - `rate` (numeric) - rate per meter
      - `cost` (numeric) - total cost for this item
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `sawing_items` table
    - Add policy for public access (same as hours_registration)

  3. Notes
    - This allows multiple sawing items per registration
    - The hours_registration table will keep its sawing fields for backward compatibility
*/

CREATE TABLE IF NOT EXISTS sawing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid REFERENCES hours_registration(id) ON DELETE CASCADE,
  material text NOT NULL,
  meters numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sawing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to sawing items"
  ON sawing_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sawing_items_registration_id ON sawing_items(registration_id);
