/*
  # Urenregistratie Tabel

  1. Nieuwe Tabellen
    - `hours_registration`
      - `id` (uuid, primary key) - Unieke identificatie
      - `date` (date) - Datum van de registratie
      - `week_number` (integer) - Weeknummer
      - `year` (integer) - Jaar
      - `stratenmaker_hours` (decimal) - Aantal uren stratenmaker
      - `stratenmaker_rate` (decimal) - Uurloon stratenmaker
      - `opperman_hours` (decimal) - Aantal uren opperman
      - `opperman_rate` (decimal) - Uurloon opperman
      - `koppel_hours` (decimal) - Aantal koppeluren
      - `koppel_rate` (decimal) - Uurloon koppel
      - `sawing_meters` (decimal) - Aantal gezaagde meters (m1)
      - `sawing_rate` (decimal) - Bedrag per meter zagen
      - `total_labor_cost` (decimal) - Totale arbeidskosten
      - `total_sawing_cost` (decimal) - Totale zaagkosten
      - `total_cost` (decimal) - Totale kosten
      - `notes` (text) - Opmerkingen/notities
      - `created_at` (timestamptz) - Aanmaakdatum
      - `updated_at` (timestamptz) - Laatst gewijzigd
  
  2. Beveiliging
    - RLS ingeschakeld op `hours_registration` tabel
    - Iedereen kan registraties bekijken (voor nu open toegang)
    - Iedereen kan registraties toevoegen
    - Iedereen kan registraties bijwerken
    - Iedereen kan registraties verwijderen
  
  3. Indexen
    - Index op datum voor snelle datumzoekopdrachten
    - Index op weeknummer en jaar voor weekoverzichten
*/

CREATE TABLE IF NOT EXISTS hours_registration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  week_number integer NOT NULL,
  year integer NOT NULL,
  stratenmaker_hours decimal(10,2) DEFAULT 0,
  stratenmaker_rate decimal(10,2) DEFAULT 0,
  opperman_hours decimal(10,2) DEFAULT 0,
  opperman_rate decimal(10,2) DEFAULT 0,
  koppel_hours decimal(10,2) DEFAULT 0,
  koppel_rate decimal(10,2) DEFAULT 0,
  sawing_meters decimal(10,2) DEFAULT 0,
  sawing_rate decimal(10,2) DEFAULT 0,
  total_labor_cost decimal(10,2) DEFAULT 0,
  total_sawing_cost decimal(10,2) DEFAULT 0,
  total_cost decimal(10,2) DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE hours_registration ENABLE ROW LEVEL SECURITY;

-- Policies (open toegang voor nu - later kunnen we dit beperken met authenticatie)
CREATE POLICY "Allow public read access"
  ON hours_registration
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON hours_registration
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON hours_registration
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access"
  ON hours_registration
  FOR DELETE
  USING (true);

-- Indexen voor betere performance
CREATE INDEX IF NOT EXISTS idx_hours_registration_date ON hours_registration(date);
CREATE INDEX IF NOT EXISTS idx_hours_registration_week ON hours_registration(week_number, year);

-- Trigger om updated_at automatisch bij te werken
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hours_registration_updated_at 
  BEFORE UPDATE ON hours_registration 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();