/*
  # Populate all products from quotation tool
  
  1. Changes
    - Remove all existing products (fresh start)
    - Add all products from the quotation tool HTML including:
      * STRAATWERK (paving work)
      * GRONDWERK (groundwork)
      * ARBEID (labor)
      * GEMEENTEWERK (municipal work)
      * PVC RIOLERING (PVC sewage - with diameter variants)
      * PVC (loose PVC materials)
      * VERHUUR (rental equipment)
      * CONTAINERS (waste containers - various types)
      * OVERIG (miscellaneous)
    
  2. Notes
    - PVC RIOLERING items with variants are split into separate rows per diameter
    - No duplicate products
    - All prices are in EUR excluding VAT
*/

-- Clear existing products
TRUNCATE TABLE products;

-- STRAATWERK
INSERT INTO products (category, name, unit, price) VALUES
('STRAATWERK', 'Bestrating uitbreken', 'm²', 15.00),
('STRAATWERK', 'Herbestarten tegels', 'm²', 25.00),
('STRAATWERK', 'Herbestarten stenen', 'm²', 30.00),
('STRAATWERK', 'Bestrating aanleggen tegels nieuw', 'm²', 35.00),
('STRAATWERK', 'bestrating aanleggen stenen nieuw', 'm²', 25.00),
('STRAATWERK', 'bloembak aanbrengen', 'm¹', 25.00),
('STRAATWERK', 'Tegels zagen', 'm¹', 15.00),
('STRAATWERK', 'Pasmaken dmv knippen', 'm¹', 8.00),
('STRAATWERK', 'Opsluitbanden uitbreken', 'm¹', 6.00),
('STRAATWERK', 'Opsluitbanden plaatsen 6x20', 'm¹', 5.00),
('STRAATWERK', 'Opsluitbanden plaatsen 10/20', 'm¹', 12.00),
('STRAATWERK', 'Opsluitbanden plaatsen 13/15 en groter', 'm¹', 12.00),
('STRAATWERK', 'Voegen van tuin (excl. materiaal)', 'm²', 12.00),
('STRAATWERK', 'Verwijderen van voegsel aan oude tegels', 'm²', 8.00),
('STRAATWERK', 'Puin afvoeren', 'klus', 75.00);

-- GRONDWERK
INSERT INTO products (category, name, unit, price) VALUES
('GRONDWERK', 'Zand aanbrengen+leveren', 'm³', 60.00),
('GRONDWERK', 'Grond afgraven', 'm³', 25.00),
('GRONDWERK', 'Tuinaarde aanbrengen', 'm³', 55.00),
('GRONDWERK', 'Grond afgraven (zonder schone verklaring)', 'm³', 95.00),
('GRONDWERK', 'Grond aanbrengen incl. leveren - Teelaarde', 'm³', 65.00),
('GRONDWERK', 'Grond aanbrengen incl. leveren - Tuinaarde', 'm³', 55.00),
('GRONDWERK', 'Grond aanbrengen incl. leveren - Schrale grond', 'm³', 45.00),
('GRONDWERK', 'Grond aanbrengen incl. leveren - Vulgrond / ophooggrond', 'm³', 40.00),
('GRONDWERK', 'Grond aanbrengen incl. leveren - Compostgrond', 'm³', 70.00),
('GRONDWERK', 'Gras leggen', 'm²', 10.00),
('GRONDWERK', 'Drainage aanleggen', 'meter', 15.00),
('GRONDWERK', 'Tuinpad aanleggen', 'm²', 30.00),
('GRONDWERK', 'Beplanting aanbrengen', 'stuk', 6.00),
('GRONDWERK', 'Boom plaatsen', 'stuk', 40.00),
('GRONDWERK', 'BigBag zand incl. levering', 'stuk', 85.00),
('GRONDWERK', 'BigBag teelaarde incl. levering', 'stuk', 115.00),
('GRONDWERK', 'BigBag schrale grond incl. levering', 'stuk', 95.00),
('GRONDWERK', 'BigBag vulgrond incl. levering', 'stuk', 75.00);

-- ARBEID
INSERT INTO products (category, name, unit, price) VALUES
('ARBEID', 'Stratenmaker (per uur)', 'uur', 60.00),
('ARBEID', 'Opperman (per uur)', 'uur', 45.00);

-- GEMEENTEWERK
INSERT INTO products (category, name, unit, price) VALUES
('GEMEENTEWERK', 'Trottoirbanden plaatsen', 'meter', 18.00),
('GEMEENTEWERK', 'Riolering leggen PVC Ø125-160mm', 'meter', 65.00),
('GEMEENTEWERK', 'Riolering leggen PVC Ø200-250mm', 'meter', 85.00),
('GEMEENTEWERK', 'Kolken leveren en plaatsen', 'stuk', 350.00),
('GEMEENTEWERK', 'Fundering (menggranulaat) aanbrengen', 'm³', 40.00),
('GEMEENTEWERK', 'Putkoppen leveren en plaatsen', 'stuk', 200.00),
('GEMEENTEWERK', 'Straatkolkdeksels leveren en plaatsen', 'stuk', 175.00),
('GEMEENTEWERK', 'Aansluiten kolk op hoofdriool', 'stuk', 150.00);

-- PVC RIOLERING (met diameter varianten als aparte rijen)
INSERT INTO products (category, name, unit, price) VALUES
('PVC RIOLERING', 'PVC buis SN8 - 5m Ø110', 'stuk', 21.60),
('PVC RIOLERING', 'PVC buis SN8 - 5m Ø125', 'stuk', 22.46),
('PVC RIOLERING', 'PVC buis SN8 - 5m Ø160', 'stuk', 42.00),
('PVC RIOLERING', 'PVC buis SN8 - 5m Ø200', 'stuk', 75.80),

('PVC RIOLERING', 'PVC bocht 45° SN4 Ø110', 'stuk', 6.10),
('PVC RIOLERING', 'PVC bocht 45° SN4 Ø125', 'stuk', 7.70),
('PVC RIOLERING', 'PVC bocht 45° SN4 Ø160', 'stuk', 12.40),
('PVC RIOLERING', 'PVC bocht 45° SN4 Ø200', 'stuk', 30.10),

('PVC RIOLERING', 'PVC bocht 90° SN4 Ø110', 'stuk', 6.10),
('PVC RIOLERING', 'PVC bocht 90° SN4 Ø125', 'stuk', 10.00),
('PVC RIOLERING', 'PVC bocht 90° SN4 Ø160', 'stuk', 18.50),
('PVC RIOLERING', 'PVC bocht 90° SN4 Ø200', 'stuk', 44.00),

('PVC RIOLERING', 'PVC T-stuk 45° SN4 Ø110', 'stuk', 8.10),
('PVC RIOLERING', 'PVC T-stuk 45° SN4 Ø125', 'stuk', 10.50),
('PVC RIOLERING', 'PVC T-stuk 45° SN4 Ø160', 'stuk', 20.40),
('PVC RIOLERING', 'PVC T-stuk 45° SN4 Ø200', 'stuk', 46.40),

('PVC RIOLERING', 'PVC Y-stuk 45° SN4 Ø110', 'stuk', 8.10),
('PVC RIOLERING', 'PVC Y-stuk 45° SN4 Ø125', 'stuk', 10.50),
('PVC RIOLERING', 'PVC Y-stuk 45° SN4 Ø160', 'stuk', 20.40),
('PVC RIOLERING', 'PVC Y-stuk 45° SN4 Ø200', 'stuk', 46.40),

('PVC RIOLERING', 'PVC overschuifmof SN4 Ø110', 'stuk', 11.80),
('PVC RIOLERING', 'PVC overschuifmof SN4 Ø125', 'stuk', 14.50),
('PVC RIOLERING', 'PVC overschuifmof SN4 Ø160', 'stuk', 22.00),
('PVC RIOLERING', 'PVC overschuifmof SN4 Ø200', 'stuk', 49.00),

('PVC RIOLERING', 'PVC verloop SN4 110→125', 'stuk', 19.40),
('PVC RIOLERING', 'PVC verloop SN4 125→110', 'stuk', 19.40),
('PVC RIOLERING', 'PVC verloop SN4 160→125', 'stuk', 24.90),
('PVC RIOLERING', 'PVC verloop SN4 200→160', 'stuk', 34.90);

-- PVC (los materiaal)
INSERT INTO products (category, name, unit, price) VALUES
('PVC', 'PVC buis Ø50 mm', 'm¹', 1.75),
('PVC', 'PVC buis Ø75 mm', 'm¹', 2.40),
('PVC', 'PVC buis Ø110 mm', 'm¹', 3.60),
('PVC', 'PVC buis Ø125 mm', 'm¹', 4.80),
('PVC', 'PVC buis Ø160 mm', 'm¹', 6.80),
('PVC', 'PVC schuifmof Ø110 mm (2x manchet)', 'stuk', 2.50),
('PVC', 'PVC overschuifmof Ø110 mm', 'stuk', 4.95),
('PVC', 'PVC steekmof Ø110 mm (lijm)', 'stuk', 2.25),
('PVC', 'PVC bocht 45° mof/spie Ø110 mm', 'stuk', 4.75),
('PVC', 'PVC bocht 90° mof/spie Ø110 mm', 'stuk', 5.50),
('PVC', 'PVC T-stuk 45° Ø110 mm', 'stuk', 7.00),
('PVC', 'PVC ontstoppingsstuk Ø110 mm', 'stuk', 10.00),
('PVC', 'PVC eindkap Ø110 mm', 'stuk', 1.75),
('PVC', 'PVC verloop T-stuk 110/50 mm 45°', 'stuk', 4.50);

-- VERHUUR
INSERT INTO products (category, name, unit, price) VALUES
('VERHUUR', 'Mini kraan Kubota 1000 kg – dag', 'dag', 120.00),
('VERHUUR', 'Mini kraan Kubota 1000 kg – week', 'week', 415.00),
('VERHUUR', 'Messersi rupsdumper – dag', 'dag', 95.00),
('VERHUUR', 'Messersi rupsdumper – week', 'week', 350.00),
('VERHUUR', 'Giant G1500L X-TRA shovel – dag', 'dag', 140.00),
('VERHUUR', 'Giant G1500L X-TRA shovel – week', 'week', 490.00),
('VERHUUR', 'Afschotlaser – dag', 'dag', 30.00),
('VERHUUR', 'Afschotlaser – week', 'week', 90.00),
('VERHUUR', 'Carat zaagtafel 120 cm – dag', 'dag', 60.00),
('VERHUUR', 'Carat zaagtafel 120 cm – week', 'week', 180.00),
('VERHUUR', 'Lumag trilplaat 1 ton – dag', 'dag', 30.00),
('VERHUUR', 'Lumag trilplaat 1 ton – week', 'week', 100.00),
('VERHUUR', 'Trilplaat 3,5 ton – dag', 'dag', 40.00),
('VERHUUR', 'Trilplaat 3,5 ton – week', 'week', 130.00),
('VERHUUR', 'Trilplaat 6 ton – dag', 'dag', 50.00),
('VERHUUR', 'Trilplaat 6 ton – week', 'week', 170.00),
('VERHUUR', 'Wacker stamper – dag', 'dag', 35.00),
('VERHUUR', 'Wacker stamper – week', 'week', 110.00),
('VERHUUR', 'Doorslijper Husqvarna K770 (300 blad) – dag', 'dag', 45.00),
('VERHUUR', 'Doorslijper Husqvarna K770 (300 blad) – week', 'week', 140.00),
('VERHUUR', 'Hydraulische knipper – dag', 'dag', 50.00),
('VERHUUR', 'Hydraulische knipper – week', 'week', 160.00),
('VERHUUR', 'Strakvlakmachine – dag', 'dag', 55.00),
('VERHUUR', 'Strakvlakmachine – week', 'week', 180.00);

-- CONTAINERS
INSERT INTO products (category, name, unit, price) VALUES
('GRONDCONTAINERS (SCHONE GROND)', 'Grond 3 m³', 'stuk', 285.00),
('GRONDCONTAINERS (SCHONE GROND)', 'Grond 6 m³', 'stuk', 389.00),
('GRONDCONTAINERS (SCHONE GROND)', 'Grond 10 m³', 'stuk', 525.00),
('GRONDCONTAINERS (SCHONE GROND)', 'Grond 15 m³', 'stuk', 825.00),

('GROENCONTAINERS (TUINAFVAL)', 'Groen 3 m³', 'stuk', 139.00),
('GROENCONTAINERS (TUINAFVAL)', 'Groen 6 m³', 'stuk', 172.00),
('GROENCONTAINERS (TUINAFVAL)', 'Groen 10 m³', 'stuk', 220.00),
('GROENCONTAINERS (TUINAFVAL)', 'Groen 20 m³', 'stuk', 468.00),
('GROENCONTAINERS (TUINAFVAL)', 'Groen 40 m³', 'stuk', 690.00),

('BOUW- & SLOOPCONTAINERS', 'Bouw & sloop 3 m³', 'stuk', 230.00),
('BOUW- & SLOOPCONTAINERS', 'Bouw & sloop 6 m³', 'stuk', 313.00),
('BOUW- & SLOOPCONTAINERS', 'Bouw & sloop 10 m³', 'stuk', 395.00),
('BOUW- & SLOOPCONTAINERS', 'Bouw & sloop 20 m³', 'stuk', 980.00),
('BOUW- & SLOOPCONTAINERS', 'Bouw & sloop 40 m³', 'stuk', 1440.00),

('PUINCONTAINERS', 'Puin 3 m³', 'stuk', 129.00),
('PUINCONTAINERS', 'Puin 6 m³', 'stuk', 139.00),
('PUINCONTAINERS', 'Puin 10 m³', 'stuk', 199.00),
('PUINCONTAINERS', 'Puin 20 m³', 'stuk', 350.00),
('PUINCONTAINERS', 'Puin 40 m³', 'stuk', 550.00),

('GRONDCONTAINERS VERVUILD', 'Grond 3 m³', 'stuk', 500.00),
('GRONDCONTAINERS VERVUILD', 'Grond 6 m³', 'stuk', 600.00),
('GRONDCONTAINERS VERVUILD', 'Grond 10 m³', 'stuk', 700.00),
('GRONDCONTAINERS VERVUILD', 'Grond 15 m³', 'stuk', 1100.00);

-- OVERIG
INSERT INTO products (category, name, unit, price) VALUES
('OVERIG', 'Transformator plaatsen (in-lite)', 'stuk', 80.00),
('OVERIG', 'Grondkabel aanleggen en ingraven', 'm¹', 10.00),
('OVERIG', 'Tuinverlichting plaatsen en aansluiten', 'punt', 30.00),
('OVERIG', 'Complete aanleg tuinverlichting', 'klus', 225.00),
('OVERIG', 'Voorrijkosten', 'stuk', 65.00),
('OVERIG', 'Brandstofkosten machines', 'dag/machines', 25.00);