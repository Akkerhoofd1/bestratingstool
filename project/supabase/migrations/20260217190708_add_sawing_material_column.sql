/*
  # Add sawing_material column to hours_registration table

  1. Changes
    - Add `sawing_material` column to `hours_registration` table
      - Type: text
      - Default: empty string
      - Stores the type of material being sawed (e.g., 'Banden 13/15', 'Banden 18/20', etc.)
  
  2. Notes
    - This column allows tracking what material is being cut during sawing work
    - Uses IF NOT EXISTS pattern to prevent errors if column already exists
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hours_registration' AND column_name = 'sawing_material'
  ) THEN
    ALTER TABLE hours_registration ADD COLUMN sawing_material text DEFAULT '';
  END IF;
END $$;