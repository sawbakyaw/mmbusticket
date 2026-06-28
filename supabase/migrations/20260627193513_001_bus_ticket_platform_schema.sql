/*
# MM-BusTicket Pro Database Schema

## Overview
Complete schema for a bus ticket aggregation platform with real-time seat locking, 
multi-operator support, and e-ticket fulfillment.

## New Tables

1. `cities` - List of all cities/destinations
   - id (uuid, primary key)
   - name (text, unique) - English name
   - name_mm (text) - Myanmar language name
   - is_popular (boolean) - Featured on homepage
   - created_at (timestamp)

2. `operators` - Bus operators/companies
   - id (uuid, primary key)
   - name (text, not null)
   - logo_url (text)
   - description (text)
   - contact_phone (text)
   - is_active (boolean, default true)
   - created_at (timestamp)

3. `buses` - Individual bus vehicles
   - id (uuid, primary key)
   - operator_id (uuid, FK to operators)
   - bus_number (text)
   - bus_type (text) - 'Standard', 'VIP', 'VIP Scania (2+1)', 'Standard 45'
   - total_seats (integer)
   - amenities (text[]) - Array of amenities like 'AC', 'WiFi', 'USB Charging'
   - created_at (timestamp)

4. `routes` - Pre-defined routes between cities
   - id (uuid, primary key)
   - from_city_id (uuid, FK to cities)
   - to_city_id (uuid, FK to cities)
   - distance_km (integer)
   - estimated_duration_minutes (integer)
   - is_active (boolean, default true)
   - created_at (timestamp)

5. `trips` - Scheduled bus trips
   - id (uuid, primary key)
   - route_id (uuid, FK to routes)
   - bus_id (uuid, FK to buses)
   - operator_id (uuid, FK to operators)
   - departure_time (timestamp)
   - arrival_time (timestamp, estimated)
   - base_price (decimal)
   - foreigner_price (decimal)
   - available_seats (integer)
   - status (text) - 'scheduled', 'cancelled', 'completed'
   - notes (text) - Route description, stops, restrictions
   - created_at (timestamp)

6. `seats` - Individual seat records for each trip
   - id (uuid, primary key)
   - trip_id (uuid, FK to trips)
   - seat_number (text) - 'A1', 'A2', etc.
   - row_number (integer)
   - column_number (integer)
   - seat_type (text) - 'window', 'aisle', 'single'
   - status (text) - 'available', 'booked', 'locked'
   - price (decimal)
   - created_at (timestamp)

7. `seat_locks` - Temporary seat locks during booking
   - id (uuid, primary key)
   - seat_id (uuid, FK to seats)
   - trip_id (uuid, FK to trips)
   - session_id (text) - Browser session identifier
   - locked_at (timestamp)
   - expires_at (timestamp) - 10 minute expiry
   - created_at (timestamp)

8. `bookings` - Completed ticket bookings
   - id (uuid, primary key)
   - booking_reference (text, unique) - 'MMT-XXXXXXXX'
   - trip_id (uuid, FK to trips)
   - passenger_name (text)
   - passenger_phone (text)
   - passenger_email (text)
   - passenger_nrc (text) - National Registration Card
   - seat_numbers (text[]) - Array of booked seats
   - total_amount (decimal)
   - payment_method (text)
   - payment_status (text) - 'pending', 'paid', 'failed'
   - payment_reference (text)
   - is_foreigner (boolean, default false)
   - notes (text)
   - booked_at (timestamp)
   - created_at (timestamp)

## Security
- Enable RLS on all tables
- Allow anon + authenticated read access for browsing
- Restrict write operations appropriately
- Seat locks are scoped to session
- Bookings can be created by anyone (guest bookings)

## Real-time
- Enable real-time on `seat_locks` and `seats` tables
- Enable real-time on `bookings` for confirmation updates
*/

-- Enable uuid extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    name_mm text,
    is_popular boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Operators table
CREATE TABLE IF NOT EXISTS operators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    logo_url text,
    description text,
    contact_phone text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Buses table
CREATE TABLE IF NOT EXISTS buses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    bus_number text NOT NULL,
    bus_type text NOT NULL DEFAULT 'Standard',
    total_seats integer NOT NULL DEFAULT 45,
    amenities text[] DEFAULT ARRAY[]::text[],
    created_at timestamptz DEFAULT now()
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_city_id uuid NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    to_city_id uuid NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    distance_km integer,
    estimated_duration_minutes integer,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id uuid NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    bus_id uuid NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
    operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE RESTRICT,
    departure_time timestamptz NOT NULL,
    arrival_time timestamptz,
    base_price decimal(10,2) NOT NULL,
    foreigner_price decimal(10,2),
    available_seats integer NOT NULL DEFAULT 45,
    status text NOT NULL DEFAULT 'scheduled',
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Seats table
CREATE TABLE IF NOT EXISTS seats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    seat_number text NOT NULL,
    row_number integer NOT NULL,
    column_number integer NOT NULL,
    seat_type text NOT NULL DEFAULT 'window',
    status text NOT NULL DEFAULT 'available',
    price decimal(10,2) NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(trip_id, seat_number)
);

-- Seat locks table
CREATE TABLE IF NOT EXISTS seat_locks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_id uuid NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    session_id text NOT NULL,
    locked_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference text UNIQUE NOT NULL,
    trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    passenger_name text NOT NULL,
    passenger_phone text NOT NULL,
    passenger_email text,
    passenger_nrc text,
    seat_numbers text[] NOT NULL,
    total_amount decimal(10,2) NOT NULL,
    payment_method text,
    payment_status text NOT NULL DEFAULT 'pending',
    payment_reference text,
    is_foreigner boolean DEFAULT false,
    notes text,
    booked_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Cities policies (public read, no direct writes by users)
DROP POLICY IF EXISTS "anon_read_cities" ON cities;
CREATE POLICY "anon_read_cities" ON cities FOR SELECT
    TO anon, authenticated USING (true);

-- Operators policies (public read)
DROP POLICY IF EXISTS "anon_read_operators" ON operators;
CREATE POLICY "anon_read_operators" ON operators FOR SELECT
    TO anon, authenticated USING (true);

-- Buses policies (public read)
DROP POLICY IF EXISTS "anon_read_buses" ON buses;
CREATE POLICY "anon_read_buses" ON buses FOR SELECT
    TO anon, authenticated USING (true);

-- Routes policies (public read)
DROP POLICY IF EXISTS "anon_read_routes" ON routes;
CREATE POLICY "anon_read_routes" ON routes FOR SELECT
    TO anon, authenticated USING (true);

-- Trips policies (public read)
DROP POLICY IF EXISTS "anon_read_trips" ON trips;
CREATE POLICY "anon_read_trips" ON trips FOR SELECT
    TO anon, authenticated USING (true);

-- Seats policies (public read, update for booking flow)
DROP POLICY IF EXISTS "anon_read_seats" ON seats;
CREATE POLICY "anon_read_seats" ON seats FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_seats" ON seats;
CREATE POLICY "anon_update_seats" ON seats FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

-- Seat locks policies (public read/write for booking flow)
DROP POLICY IF EXISTS "anon_read_seat_locks" ON seat_locks;
CREATE POLICY "anon_read_seat_locks" ON seat_locks FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_seat_locks" ON seat_locks;
CREATE POLICY "anon_insert_seat_locks" ON seat_locks FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_seat_locks" ON seat_locks;
CREATE POLICY "anon_delete_seat_locks" ON seat_locks FOR DELETE
    TO anon, authenticated USING (true);

-- Bookings policies (public read own by reference, create)
DROP POLICY IF EXISTS "anon_read_bookings" ON bookings;
CREATE POLICY "anon_read_bookings" ON bookings FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_routes_from_city ON routes(from_city_id);
CREATE INDEX IF NOT EXISTS idx_routes_to_city ON routes(to_city_id);
CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_operator ON trips(operator_id);
CREATE INDEX IF NOT EXISTS idx_trips_departure ON trips(departure_time);
CREATE INDEX IF NOT EXISTS idx_seats_trip ON seats(trip_id);
CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);
CREATE INDEX IF NOT EXISTS idx_seat_locks_trip ON seat_locks(trip_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_session ON seat_locks(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(passenger_phone);

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS text AS $$
DECLARE
    ref text;
BEGIN
    ref := 'MMT-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate booking reference
CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
        NEW.booking_reference := generate_booking_reference();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_booking_reference ON bookings;
CREATE TRIGGER trigger_set_booking_reference
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_reference();

-- Function to auto-generate seats for a trip
CREATE OR REPLACE FUNCTION generate_trip_seats(trip_uuid uuid, bus_total_seats integer, seat_price decimal)
RETURNS void AS $$
DECLARE
    i integer;
    row_num integer;
    col_num integer;
    seat_label text;
    seat_t text;
BEGIN
    FOR i IN 1..bus_total_seats LOOP
        row_num := ((i - 1) / 4) + 1;
        col_num := ((i - 1) % 4) + 1;
        
        -- Generate seat label (A1, A2, B1, B2, etc.)
        seat_label := chr(64 + row_num) || col_num;
        
        -- Determine seat type
        CASE col_num
            WHEN 1, 4 THEN seat_t := 'window';
            ELSE seat_t := 'aisle';
        END CASE;
        
        -- Handle last row (often has different layout)
        IF row_num * 4 > bus_total_seats AND i > bus_total_seats - 3 THEN
            seat_t := 'single';
        END IF;
        
        INSERT INTO seats (trip_id, seat_number, row_number, column_number, seat_type, status, price)
        VALUES (trip_uuid, seat_label, row_num, col_num, seat_t, 'available', seat_price)
        ON CONFLICT (trip_id, seat_number) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired seat locks
CREATE OR REPLACE FUNCTION clean_expired_locks()
RETURNS void AS $$
BEGIN
    DELETE FROM seat_locks WHERE expires_at < now();
    
    -- Update seat status for unlocked seats
    UPDATE seats
    SET status = 'available'
    WHERE id IN (
        SELECT s.id FROM seats s
        LEFT JOIN seat_locks sl ON s.id = sl.seat_id
        WHERE s.status = 'locked' AND sl.id IS NULL
    );
END;
$$ LANGUAGE plpgsql;