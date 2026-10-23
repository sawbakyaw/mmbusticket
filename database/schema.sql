CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (name IN ('super_admin', 'admin', 'operator_admin', 'operator_staff', 'agent_admin', 'agent_staff', 'customer')),
  display_name text NOT NULL,
  description text,
  level integer NOT NULL DEFAULT 0,
  is_system boolean NOT NULL DEFAULT true,
  permissions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  phone text,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id),
  company_name text,
  phone_verified boolean NOT NULL DEFAULT false,
  email_verified boolean NOT NULL DEFAULT false,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  avatar_url text,
  address text,
  city text,
  country text NOT NULL DEFAULT 'Myanmar',
  timezone text NOT NULL DEFAULT 'Asia/Yangon',
  language text NOT NULL DEFAULT 'en',
  notification_preferences jsonb NOT NULL DEFAULT '{"email":true,"sms":true,"push":false}',
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  last_login_ip text,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_mm text,
  is_popular boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  description text,
  contact_phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES operators(id),
  bus_number text NOT NULL,
  bus_type text NOT NULL DEFAULT 'standard',
  total_seats integer NOT NULL DEFAULT 40 CHECK (total_seats > 0),
  amenities text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(operator_id, bus_number)
);

CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_city_id uuid NOT NULL REFERENCES cities(id),
  to_city_id uuid NOT NULL REFERENCES cities(id),
  distance_km numeric(10,2),
  estimated_duration_minutes integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_city_id <> to_city_id),
  UNIQUE(from_city_id, to_city_id)
);

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES routes(id),
  bus_id uuid NOT NULL REFERENCES buses(id),
  operator_id uuid NOT NULL REFERENCES operators(id),
  departure_time timestamptz NOT NULL,
  arrival_time timestamptz,
  base_price numeric(12,2) NOT NULL CHECK (base_price >= 0),
  foreigner_price numeric(12,2) CHECK (foreigner_price IS NULL OR foreigner_price >= 0),
  available_seats integer NOT NULL DEFAULT 0 CHECK (available_seats >= 0),
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  seat_number text NOT NULL,
  row_number integer NOT NULL,
  column_number integer NOT NULL,
  seat_type text NOT NULL DEFAULT 'regular',
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'locked', 'booked', 'unavailable')),
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trip_id, seat_number)
);

CREATE TABLE IF NOT EXISTS seat_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id uuid NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(seat_id)
);

CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_code text NOT NULL UNIQUE,
  company_name text NOT NULL,
  contact_person text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  address text,
  city text,
  commission_rate numeric(7,4) NOT NULL DEFAULT 0,
  credit_limit numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES app_users(id),
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operator_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff',
  permissions text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(operator_id, user_id)
);

CREATE TABLE IF NOT EXISTS agent_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff',
  permissions text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, user_id)
);

CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id) ON DELETE CASCADE,
  operator_id uuid REFERENCES operators(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  wallet_type text NOT NULL DEFAULT 'user',
  balance numeric(14,2) NOT NULL DEFAULT 0,
  frozen_balance numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MMK',
  is_active boolean NOT NULL DEFAULT true,
  min_balance numeric(14,2) NOT NULL DEFAULT 0,
  max_balance numeric(14,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(user_id, operator_id, agent_id) <= 1)
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text NOT NULL UNIQUE DEFAULT 'MMB-' || upper(encode(gen_random_bytes(16), 'hex')),
  trip_id uuid NOT NULL REFERENCES trips(id),
  operator_id uuid REFERENCES operators(id),
  passenger_name text NOT NULL,
  passenger_phone text NOT NULL,
  passenger_email text,
  passenger_nrc text,
  seat_numbers text[] NOT NULL,
  total_amount numeric(14,2) NOT NULL CHECK (total_amount >= 0),
  payment_method text,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_reference text,
  is_foreigner boolean NOT NULL DEFAULT false,
  notes text,
  booked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  wallet_id uuid REFERENCES wallets(id),
  gateway_transaction_id uuid,
  commission_rule_id uuid,
  platform_fee numeric(14,2) NOT NULL DEFAULT 0,
  operator_payout numeric(14,2),
  agent_commission numeric(14,2) NOT NULL DEFAULT 0,
  booked_by uuid REFERENCES app_users(id),
  booking_source text NOT NULL DEFAULT 'web',
  agent_id uuid REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id),
  transaction_type text NOT NULL,
  amount numeric(14,2) NOT NULL,
  balance_before numeric(14,2) NOT NULL,
  balance_after numeric(14,2) NOT NULL,
  reference_type text,
  reference_id uuid,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  reversal_id uuid,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  gateway_type text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  is_test_mode boolean NOT NULL DEFAULT true,
  api_endpoint text,
  merchant_id text,
  secret_key_encrypted text,
  min_amount numeric(14,2) NOT NULL DEFAULT 0,
  max_amount numeric(14,2),
  fee_percentage numeric(7,4) NOT NULL DEFAULT 0,
  fee_fixed numeric(14,2) NOT NULL DEFAULT 0,
  processing_time_minutes integer NOT NULL DEFAULT 0,
  icon_url text,
  instructions text,
  config jsonb NOT NULL DEFAULT '{}',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rule_type text NOT NULL,
  operator_id uuid REFERENCES operators(id),
  route_id uuid REFERENCES routes(id),
  bus_type text,
  commission_value numeric(14,2) NOT NULL,
  min_fee numeric(14,2) NOT NULL DEFAULT 0,
  max_fee numeric(14,2),
  platform_share numeric(7,4) NOT NULL DEFAULT 0,
  agent_share numeric(7,4) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  valid_from timestamptz,
  valid_until timestamptz,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commission_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_bookings integer NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  commission_amount numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  payment_reference text,
  paid_at timestamptz,
  notes text,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id),
  requested_by uuid REFERENCES app_users(id),
  request_type text NOT NULL DEFAULT 'full',
  reason text NOT NULL,
  reason_category text,
  refund_amount numeric(14,2) NOT NULL CHECK (refund_amount >= 0),
  refund_reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES app_users(id),
  reviewed_at timestamptz,
  review_notes text,
  refund_method text,
  processed_by uuid REFERENCES app_users(id),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id),
  user_role text,
  action text NOT NULL,
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  request_path text,
  request_method text,
  response_status integer,
  error_message text,
  duration_ms integer,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES app_users(id),
  action_type text NOT NULL,
  target_type text,
  target_id text,
  description text NOT NULL,
  approval_required boolean NOT NULL DEFAULT false,
  approved_by uuid REFERENCES app_users(id),
  approved_at timestamptz,
  is_reversible boolean NOT NULL DEFAULT false,
  reversed_by uuid REFERENCES app_users(id),
  reversed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_mm text,
  content text,
  content_mm text,
  meta_title text,
  meta_description text,
  page_type text NOT NULL DEFAULT 'static',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  author_id uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cms_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}',
  updated_by uuid REFERENCES app_users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_mm text,
  template_type text NOT NULL,
  event_type text NOT NULL,
  subject text,
  subject_mm text,
  body text NOT NULL,
  body_mm text,
  variables text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id),
  template_id uuid REFERENCES notification_templates(id),
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  read_at timestamptz,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trips_route_departure_idx ON trips(route_id, departure_time) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS seats_trip_status_idx ON seats(trip_id, status);
CREATE INDEX IF NOT EXISTS seat_locks_expiry_idx ON seat_locks(expires_at);
CREATE INDEX IF NOT EXISTS bookings_trip_created_idx ON bookings(trip_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_phone_idx ON bookings(passenger_phone, booked_at DESC);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON user_sessions(expires_at);

INSERT INTO roles (name, display_name, level, permissions) VALUES
  ('super_admin', 'Super Admin', 100, ARRAY['*']),
  ('admin', 'Admin', 90, ARRAY['*']),
  ('operator_admin', 'Operator Admin', 60, ARRAY['operator.*', 'trips.*', 'buses.*', 'bookings.read']),
  ('operator_staff', 'Operator Staff', 50, ARRAY['trips.read', 'buses.read', 'bookings.read']),
  ('agent_admin', 'Agent Admin', 40, ARRAY['agent.*', 'bookings.*']),
  ('agent_staff', 'Agent Staff', 30, ARRAY['bookings.read']),
  ('customer', 'Customer', 10, ARRAY[]::text[])
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION clean_expired_locks() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE seats SET status = 'available'
  WHERE id IN (SELECT seat_id FROM seat_locks WHERE expires_at <= now())
    AND status = 'locked';
  DELETE FROM seat_locks WHERE expires_at <= now();
END;
$$;

CREATE OR REPLACE FUNCTION generate_trip_seats(trip_uuid uuid, bus_total_seats integer, seat_price numeric) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  seat_index integer;
  seat_row integer;
  seat_col integer;
  seat_labels text[] := ARRAY['A', 'B', 'C', 'D'];
BEGIN
  FOR seat_index IN 1..bus_total_seats LOOP
    seat_row := ((seat_index - 1) / 4) + 1;
    seat_col := ((seat_index - 1) % 4) + 1;
    INSERT INTO seats (trip_id, seat_number, row_number, column_number, price)
    VALUES (trip_uuid, seat_labels[seat_col] || seat_row::text, seat_row, seat_col, seat_price)
    ON CONFLICT (trip_id, seat_number) DO NOTHING;
  END LOOP;
END;
$$;
