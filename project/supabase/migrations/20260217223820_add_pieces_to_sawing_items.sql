/*
  # Add pieces and size columns to sawing_items

  1. Changes
    - Add `pieces` column (integer) - number of pieces being sawed
    - Add `size_cm` column (numeric) - size per piece in centimeters
    - Keep `meters` column for calculated or direct meter input
    - Add `input_type` column to track whether user entered pieces or meters directly
  
  2. Notes
    - When `input_type` = 'pieces', meters = (pieces × size_cm) / 100
    - When `input_type` = 'meters', user entered meters directly
    - Existing data will default to 'meters' input type
*/

DO $$
BEGIN
  -- Add pieces column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sawing_items' AND column_name = 'pieces'
  ) THEN
    ALTER TABLE sawing_items ADD COLUMN pieces integer DEFAULT 0;
  END IF;

  -- Add size_cm column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sawing_items' AND column_name = 'size_cm'
  ) THEN
    ALTER TABLE sawing_items ADD COLUMN size_cm numeric DEFAULT 0;
  END IF;

  -- Add input_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sawing_items' AND column_name = 'input_type'
  ) THEN
    ALTER TABLE sawing_items ADD COLUMN input_type text DEFAULT 'meters' CHECK (input_type IN ('meters', 'pieces'));
  END IF;
END $$;