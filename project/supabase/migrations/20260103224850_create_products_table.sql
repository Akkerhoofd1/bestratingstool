/*
  # Create products table for PVC products catalog

  ## New Tables
  
  ### `products`
  - `id` (uuid, primary key) - Unique identifier for each product
  - `name` (text, not null) - Product name
  - `price` (numeric, not null) - Product price in euros (excl. VAT)
  - `category` (text, not null) - Product category for organization
  - `created_at` (timestamptz) - Timestamp when product was added
  - `updated_at` (timestamptz) - Timestamp when product was last updated

  ## Security
  
  1. Enable RLS on products table
  2. Add policy for public read access (product catalog is public)
  3. Add policy for authenticated users to insert products
  4. Add policy for authenticated users to update products
  5. Add policy for authenticated users to delete products

  ## Notes
  
  - Products are public catalog items that anyone can view
  - Only authenticated users can manage (add/edit/delete) products
  - Price is stored as numeric for precise calculations
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update
CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for category searches
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Create index for name searches
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);