/*
  # Bestratings Teken- & Uitzettool Database Schema

  1. New Tables
    - `sketch_projects`
      - `id` (uuid, primary key)
      - `name` (text) - Project naam
      - `created_at` (timestamptz) - Aanmaakdatum
      - `updated_at` (timestamptz) - Laatste wijziging
      - `user_id` (uuid) - Optioneel: gebruiker die het project heeft gemaakt
      - `project_data` (jsonb) - Volledige project state (points, segments, polygons, benchmarks)
      - `unit_preference` (text) - Eenheid voorkeur (mm, cm, m)
      - `thumbnail` (text) - Optioneel: preview afbeelding

  2. Security
    - Enable RLS on `sketch_projects` table
    - Add policies for public access (geen auth vereist voor demo)
    - In productie: policies aanpassen voor authenticated users only
*/

CREATE TABLE IF NOT EXISTS sketch_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Nieuw Project',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid,
  project_data jsonb NOT NULL DEFAULT '{"points":[],"segments":[],"polygons":[],"benchmarks":[]}'::jsonb,
  unit_preference text NOT NULL DEFAULT 'cm' CHECK (unit_preference IN ('mm', 'cm', 'm')),
  thumbnail text
);

ALTER TABLE sketch_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to sketch projects"
  ON sketch_projects
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to sketch projects"
  ON sketch_projects
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to sketch projects"
  ON sketch_projects
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to sketch projects"
  ON sketch_projects
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_sketch_projects_created_at ON sketch_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sketch_projects_user_id ON sketch_projects(user_id);
