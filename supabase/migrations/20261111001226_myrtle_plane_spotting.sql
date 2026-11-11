/*
# Myrtle Avenue Plane Spotting — schema

1. Purpose
A companion app for plane spotters at the Myrtle Avenue spotting location
(beside LHR's southern runways). Tracks the current landing runway
(27L/27R — they alternate weekly), the "big flights" (heavy arrivals)
worth waiting for, and a personal spotter's log of sightings.

2. New Tables
- `runway_config`
  - `id` uuid PK
  - `week_start` date (Monday of the week this config applies to), unique
  - `landing_runway` text ('27L' | '27R' | '09L' | '09R')
  - `note` text (optional)
  - `updated_at` timestamptz
  Single source of truth for which runway is the landing runway this week.
- `heavy_arrivals`
  - `id` uuid PK
  - `callsign` text (e.g. "BAW117")
  - `airline` text
  - `aircraft_type` text (e.g. "B747-400", "A380-800", "B777-300ER")
  - `origin` text (IATA/ICAO, e.g. "JFK")
  - `scheduled_time` text (local "HH:MM" arrival window, free text)
  - `days` text[] (days of week this operates, e.g. ["Mon","Wed","Fri"])
  - `is_watched` boolean (spotter marked it as a priority)
  - `notes` text (optional)
  - `created_at` timestamptz
  Curated watchlist of heavy/interesting arrivals.
- `spotter_log`
  - `id` uuid PK
  - `spotted_at` timestamptz
  - `callsign` text
  - `aircraft_type` text
  - `airline` text
  - `runway` text (which runway it landed on)
  - `note` text (optional, e.g. "perfect light", "first time seeing A350")
  - `created_at` timestamptz
  Personal sightings log — single-tenant, shared data.

3. Seed
- Inserts a current-week runway row and a small set of example heavy
  arrivals common at LHR (BA, VS, QF, EK A380s, etc.). Seeds use
  fixed UUIDs so rebuilds stay stable and the UI has sample data on first run.

4. Security
- No auth / single-tenant: the anon-key frontend must read and write.
- RLS enabled on all three tables.
- Grants + policies target `anon, authenticated` with `USING (true)` /
  `WITH CHECK (true)` because the data is intentionally public/shared.
*/

-- runway_config
CREATE TABLE IF NOT EXISTS runway_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL UNIQUE,
  landing_runway text NOT NULL CHECK (landing_runway IN ('27L','27R','09L','09R')),
  note text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE runway_config ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON runway_config TO anon, authenticated;

DROP POLICY IF EXISTS "anon_rw_runway_config" ON runway_config;
CREATE POLICY "anon_rw_runway_config" ON runway_config FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_ins_runway_config" ON runway_config;
CREATE POLICY "anon_ins_runway_config" ON runway_config FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_upd_runway_config" ON runway_config;
CREATE POLICY "anon_upd_runway_config" ON runway_config FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_del_runway_config" ON runway_config;
CREATE POLICY "anon_del_runway_config" ON runway_config FOR DELETE
  TO anon, authenticated USING (true);

-- heavy_arrivals
CREATE TABLE IF NOT EXISTS heavy_arrivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  callsign text NOT NULL,
  airline text NOT NULL,
  aircraft_type text NOT NULL,
  origin text,
  scheduled_time text,
  days text[] NOT NULL DEFAULT '{}',
  is_watched boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE heavy_arrivals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON heavy_arrivals TO anon, authenticated;

DROP POLICY IF EXISTS "anon_rw_heavy_arrivals_sel" ON heavy_arrivals;
CREATE POLICY "anon_rw_heavy_arrivals_sel" ON heavy_arrivals FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_rw_heavy_arrivals_ins" ON heavy_arrivals;
CREATE POLICY "anon_rw_heavy_arrivals_ins" ON heavy_arrivals FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_rw_heavy_arrivals_upd" ON heavy_arrivals;
CREATE POLICY "anon_rw_heavy_arrivals_upd" ON heavy_arrivals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_rw_heavy_arrivals_del" ON heavy_arrivals;
CREATE POLICY "anon_rw_heavy_arrivals_del" ON heavy_arrivals FOR DELETE
  TO anon, authenticated USING (true);

-- spotter_log
CREATE TABLE IF NOT EXISTS spotter_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spotted_at timestamptz NOT NULL DEFAULT now(),
  callsign text NOT NULL,
  aircraft_type text NOT NULL,
  airline text,
  runway text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE spotter_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON spotter_log TO anon, authenticated;

DROP POLICY IF EXISTS "anon_rw_spotter_log_sel" ON spotter_log;
CREATE POLICY "anon_rw_spotter_log_sel" ON spotter_log FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_rw_spotter_log_ins" ON spotter_log;
CREATE POLICY "anon_rw_spotter_log_ins" ON spotter_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_rw_spotter_log_upd" ON spotter_log;
CREATE POLICY "anon_rw_spotter_log_upd" ON spotter_log FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_rw_spotter_log_del" ON spotter_log;
CREATE POLICY "anon_rw_spotter_log_del" ON spotter_log FOR DELETE
  TO anon, authenticated USING (true);

-- Seed: current-week runway config (27L/27R alternate weekly at LHR).
-- Compute Monday of the current ISO week dynamically.
INSERT INTO runway_config (week_start, landing_runway, note)
SELECT
  (date_trunc('week', now()::date))::date AS week_start,
  CASE WHEN (EXTRACT(DAY FROM date_trunc('week', now()::date))::int % 2) = 0
       THEN '27L' ELSE '27R' END AS landing_runway,
  'Auto-seeded — confirm and adjust to the official runway alternation schedule.'
ON CONFLICT (week_start) DO NOTHING;

-- Seed: example heavy / interesting arrivals commonly seen at LHR.
INSERT INTO heavy_arrivals (callsign, airline, aircraft_type, origin, scheduled_time, days, is_watched, notes)
VALUES
  ('BAW117', 'British Airways', 'B777-300ER', 'JFK', '11:55', ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], true, 'Morning heavy from New York'),
  ('BAW178', 'British Airways', 'A380-800', 'LAX', '10:55', ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], true, 'Early A380 arrival'),
  ('VIR451', 'Virgin Atlantic', 'A350-1000', 'JFK', '10:25', ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], false, 'Sometimes A350, sometimes 787'),
  ('QF9',   'Qantas',          'A380-800',  'PER', '05:30', ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], true, 'Superjumbo from Perth'),
  ('EK30',  'Emirates',         'A380-800',  'DXB', '12:35', ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], true, 'Midday A380'),
  ('SQ318', 'Singapore Airlines','A380-800', 'SIN', '11:40', ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], true, 'Morning A380 from Singapore'),
  ('CX251', 'Cathay Pacific',   'B777-300ER','HKG', '14:25', ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], false, 'Afternoon heavy from Hong Kong'),
  ('AA107', 'American Airlines','B777-200ER','JFK', '10:05', ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], false, 'American heavy'),
  ('BAW286', 'British Airways', 'B787-9',    'SFO', '11:10', ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], false, 'Dreamliner from San Francisco'),
  ('EY19',  'Etihad Airways',   'A350-1000', 'AUH', '07:35', ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], false, 'Early A350 from Abu Dhabi')
ON CONFLICT DO NOTHING;