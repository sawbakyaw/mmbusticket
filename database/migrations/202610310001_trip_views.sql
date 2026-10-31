CREATE TABLE IF NOT EXISTS trip_views (
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  visitor_hash char(64) NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, visitor_hash)
);
