CREATE TABLE IF NOT EXISTS bus_routes (
  id SERIAL PRIMARY KEY,
  line_number TEXT NOT NULL UNIQUE,
  path TEXT[] NOT NULL DEFAULT '{}',
  full_path TEXT NOT NULL DEFAULT ''
);

ALTER TABLE bus_routes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON bus_routes TO anon, authenticated, service_role;
GRANT USAGE ON SEQUENCE bus_routes_id_seq TO anon, authenticated, service_role;

CREATE POLICY "Bus routes are publicly readable"
  ON bus_routes FOR SELECT
  USING (true);

CREATE POLICY "Bus routes are insertable by anon"
  ON bus_routes FOR INSERT
  WITH CHECK (true);
